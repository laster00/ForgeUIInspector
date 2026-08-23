# ForgeUIInspector インタラクティブRuntime 実装準備書

## 1. 目的と現在地

ForgeUIInspectorを、静的なForge UI検査器から、次の操作を決定論的に再現できる軽量エミュレータへ拡張する。

- マウス移動とホバー判定
- 左右クリック、Shiftクリック、中クリック
- 仮想保存領域とプレイヤーインベントリ間の移動
- ページ投影、並べ替え、容量制限
- Menuのセッション・revisionを伴う要求と応答
- 同一入力トレースから同一結果を得るリプレイ

本書は実装開始前の境界、API、ファイル構成、受入条件を固定するものである。現時点では機能コードを変更しない。

## 2. 固定する設計原則

### 2.1 Fixtureは不変の表示入力

既存Fixtureは、画面を再現するための不変な初期値として扱う。操作後の個数、カーソル保持、保存領域、revisionなどの可変状態はFixtureへ書き戻さない。

これにより、既存のURL状態、スナップショット、表示専用画面との互換性を維持する。

### 2.2 DOMはMinecraftの意味を決めない

DOMイベントは論理座標とボタン・修飾キーをRuntimeへ渡すだけにする。どのSlotやカスタム領域が対象か、どのClickTypeに相当するかは、純粋なヒットテストとScreen Adapterが決める。

### 2.3 Menuは表示、Storageは正本

Minecraftの構造に合わせ、Menuを保存先にはしない。

```text
Raw input
  -> logical coordinate transform / hit test
  -> Screen Adapter
  -> Menu Emulator
  -> deterministic Transport
  -> authoritative Storage Backend
  -> response / projected client snapshot
```

Storage Backendが物理Slot、プレイヤーインベントリ、session、revisionの正本となる。Menuはその投影と操作規則を提供する。

### 2.4 保存操作はフェイルクローズ

挿入、取り出し、Shiftクリック、整理の各操作は、事前検証に失敗した場合、ItemStack、NBT、revisionのいずれも変更しない。部分適用は禁止する。

### 2.5 決定論を優先

初期実装は同期・遅延ゼロを既定にする。ただし処理経路は必ず要求と応答に分け、後から遅延、順序逆転、重複、破損要求を決定論的なtick queueで注入できる形にする。

## 3. 第1実装スライス

最初の縦切り対象はMap Stashとする。

### 対象

- 物理保存領域768 Slot
- 表示ページ96 Slot
- プレイヤーインベントリ36 Slot
- 左クリックによるPickup/Place
- 右クリックによる半分取得・1個配置
- Shiftクリックによる保存領域とプレイヤー間のQuick Move
- 中クリックによる整理
- マウスホバーとTooltip対象の決定
- page、layout、rarityに基づく表示投影（productionのMapStashClassifier準拠。search/dimensionは扱わない）
- session、revision、requestIdの検証
- 操作トレースとRuntime Snapshotの取得

### 第1スライスの対象外

- 実クライアントとのネットワーク接続
- ワールド、実セーブ、実プレイヤーデータへの書き込み
- Minecraftの全ClickTypeの完全再現
- ドラッグ分配、ダブルクリック収集、数字キー交換、Qドロップ
- IndexedDB永続化
- Currency Stashの72集約セル
- 描画スタイルの再設計

対象外項目は、Runtime契約を変えず後続スライスで追加する。

## 4. Runtime境界

### 4.1 公開API

既存APIは維持する。

- `getState()`
- `setState()`
- `reset()`
- `getCanonicalUrl()`
- `getSnapshot()`

次のAPIを追加する。

```js
dispatchInput(event)      // 正規化済み入力を適用し、結果を返す
getRuntimeSnapshot()      // client/server/menu/transportの状態を返す
getTrace()                // 適用済み入力と応答の決定論的ログを返す
resetRuntime()            // Fixture seedからRuntimeだけを再生成する
```

`reset()`は従来どおり画面状態を初期化し、その一部として`resetRuntime()`も行う。表示専用FixtureではRuntime APIは安全なno-opまたはread-only結果を返す。

### 4.2 入力イベント

DOM依存を持たない正規形を使用する。

```js
{
  type: "pointermove" | "pointerdown" | "pointerup" | "wheel" | "keydown" | "keyup",
  x: 0,
  y: 0,
  button: 0,
  buttons: 0,
  deltaY: 0,
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  key: "",
  tick: 0
}
```

`x`と`y`はMinecraft GUIの論理座標とし、CSS pixelや`elementFromPoint()`の結果を保存しない。

### 4.3 ヒットテスト優先順位

1. Screen Adapter固有の操作領域
2. MenuのSlot
3. スクロール、ページ、検索などのWidget
4. Container背景
5. 対象外

同一座標で複数候補がある場合も、この優先順位と安定した登録順で一意に決める。

## 5. データ契約

### 5.1 ItemStack

```js
{
  itemId: "namespace:path",
  count: 1,
  maxStackSize: 64,
  tag: {},
  components: {}
}
```

- 空Stackは単一のcanonical representationへ正規化する。
- 比較と結合では`itemId`だけでなく、正規化済み`tag`と`components`も含める。
- 未知のNBT/Componentは解釈せず、opaque dataとして完全に保持する。
- `count`は整数かつ`0..maxStackSize`でなければならない。
- Runtime Snapshotではキー順を正規化し、同一状態のJSON表現を安定させる。

### 5.2 Server state

```js
{
  storage: { capacity: 768, slots: [] },
  playerInventory: { slots: [] },
  sessionId: "...",
  revision: 0
}
```

### 5.3 Client/Menu state

```js
{
  menuId: "...",
  expectedSessionId: "...",
  knownRevision: 0,
  page: 0,
  layout: "all",
  rarity: "all",
  hoveredTarget: null,
  carried: null,
  pendingRequestIds: []
}
```

### 5.4 Request/Response

要求は最低限、次を含む。

```js
{
  requestId: "req-000001",
  menuId: "...",
  sessionId: "...",
  baseRevision: 0,
  operation: "pickup" | "place" | "quickMove" | "organize",
  target: {},
  modifiers: {}
}
```

応答は同一`requestId`を返し、`accepted`、拒否理由、適用後revision、必要な差分またはsnapshotを持つ。

次は変更なしで拒否する。

- menuId不一致
- sessionId不一致
- stale revision
- Slot境界外
- 不正な方向の移動
- 容量不足
- 不正なItemStack
- 重複requestId
- 未対応operation

## 6. Map Stash Adapterの規則

### 6.1 投影

- 正本は768個の物理Slotである。
- layout・rarity filter後の結果を安定した順序で並べ、96個ずつ表示する。Runtime有効化時は`validLayouts`とproduction固定rarity catalog（`all/common/uncommon/rare/epic/legendary/mythic/unique/other`）を明示し、未知のstack metadataは推測せず対象外とする。
- 表示Slotは必ず物理Slot indexへ解決できるようにする。
- filter変更や整理後は投影を再計算する。
- 範囲外ページは、結果件数に応じた有効ページへ正規化する。

### 6.2 Pickup/Place

- 左クリックはStack全体を対象とする。
- 右クリックで保持なしの場合は切り上げ半分を取得する。
- 右クリックで保持ありの場合は互換Slotへ1個だけ配置する。
- 非互換Stack同士は、左クリック時のみ交換できる。
- すべての結果は最大Stack数を超えない。

### 6.3 Quick Move

- 保存領域からはプレイヤーインベントリへ移動する。
- プレイヤーインベントリからは保存領域へ移動する。
- 既存の互換Stackを先に充填し、その後に空Slotを使用する。
- 保存領域からプレイヤーインベントリへは、production同様にmerge後の空Slotをtransfer順で調べ、全量を収容できない場合はstorage/inventory双方をrollbackして全拒否する。
- プレイヤーインベントリから保存領域へは、現在の表示filterに依存せずproductionのauto-classified selectorで分類し、non-compressingに空physical Slotへ全量を保存する。分類不能・空き不足はno-opとする。

### 6.4 Organize

- 物理保存領域だけを対象とする。
- 結合・分割・compactは行わない。選択対象が占める物理Slot間だけを、layout+rarity、item ID、canonical tag/components、original physical index順で再配置する。
- unselected/empty位置は不変とし、並び順は明示的な比較関数で固定する。
- プレイヤーインベントリとcarried Stackは変更しない。

## 7. Fixtureとの接続

Fixture v1は変更しない。画面ごとのRuntime有効化は、既存契約の外側にある任意のinteraction定義として導入する。

```js
interaction: {
  kind: "container",
  adapter: "cte2-map-stash",
  storage: { capacity: 768 },
  projection: { kind: "filtered-physical", pageSize: 96 },
  playerInventory: { slots: 36 }
}
```

interactionがない画面、または未知のadapterは表示専用として扱う。未知値を推測して操作可能にしない。

Fixtureに含まれるSlot内容はseedとしてdeep cloneし、以降の変更はRuntime stateだけに適用する。

## 8. 計画ファイルと所有境界

最初に新規の純粋モジュールとテストだけを追加する。

```text
emulator/runtime/item-stack.js
emulator/runtime/storage.js
emulator/runtime/menu.js
emulator/runtime/input.js
emulator/runtime/transport.js
emulator/runtime/adapters/map-stash.js

tests/runtime_item_stack_contract.test.mjs
tests/runtime_storage_contract.test.mjs
tests/runtime_input_contract.test.mjs
tests/runtime_map_stash_contract.test.mjs
tests/runtime_dom_contract.test.mjs
```

純粋モジュールの契約が通った後だけ、次の既存ファイルへ小さな統合変更を行う。

```text
emulator/emulator.js
emulator/emulator.css
emulator/index.html
package.json
```

作業開始時点で`emulator/emulator.js`、`emulator/emulator.css`、`package.json`などには既存の未コミット変更がある。統合時は差分を再確認し、ユーザーの変更を上書きしない。MineAndSlashAddons側にも画面クラスの未コミット変更があるため、第1スライスではread-only参照に限定する。

## 9. 実装順序

### Slice A: ItemStackとStorage

- canonical ItemStack
- NBT/Componentを含むStack key
- clone、merge、split
- 容量検証と原子的transaction
- conservation assertion

完了条件は、成功・拒否の双方でItemStack総量とopaque dataが期待どおりであること。

### Slice B: InputとHit Test

- CSS座標からGUI論理座標への変換
- stable hit target
- hover enter/leave
- Tooltip対象
- マウスボタンと修飾キーの正規化

完了条件は、GUI-2の960x540とGUI-3の1280x720で同じ論理座標が同じ対象へ解決されること。

### Slice C: Map Stash Menu

- 768物理Slotから96表示Slotへの投影
- Pickup/Place
- Quick Move
- Organize
- page/layout/rarity更新

完了条件は、normal/empty/many/otherの各データ状態で境界外アクセスがなく、操作結果が決定論的であること。

### Slice D: Transport

- requestId
- session/menu/revision検証
- 成功・拒否response
- duplicate/stale/reordered注入用queue
- trace replay

完了条件は、不正要求が完全なno-opとなり、同一traceが同一snapshotを生成すること。

### Slice E: DOM統合

- pointer/keyboardイベントを`dispatchInput()`へ接続
- hover表示
- Tooltip表示
- テスト用Runtime API公開
- 既存URL状態と表示専用Fixtureの回帰確認

完了後に必要な場合だけ、視覚変更を実クライアントcaptureと比較する。

### 後続Slice

- Currency Stashの72集約セルAdapter
- 集約cellからserver-side withdraw要求への変換
- drag、double click、number key、Q drop
- JSON import/export
- HTTP環境での任意IndexedDB backend
- latency、packet loss、reorderのシナリオUI

## 10. テストマトリクス

### ItemStack/Storage

- 空、1個、最大Stack、非Stackable
- 同一itemIdで異なるNBT/Component
- merge、split、swap
- 容量ちょうど、1個不足、完全満杯
- transaction途中失敗時のrollback

### Input/Hit Test

- Slot中央、境界、1px外側
- GUI scale相当の複数viewport
- hover enter/move/leave
- 左、右、中クリック
- Shiftあり/なし
- 対象が重なる場合の優先順位

### Menu/Transport

- storage -> player
- player -> storage
- filtered projection上の物理index解決
- stale revision
- session/menu不一致
- request/response correlation
- duplicate request
- bounds violation
- organize前後のconservation

### UI fixture

- locale: `ja_jp`, `en_us`
- data: `normal`, `empty`, `many`, `other`
- viewport: GUI-2 `960x540`, GUI-3 `1280x720`
- 初期表示、hover、carried、拒否後、リセット後

## 11. 検証コマンド

実装中は変更範囲に応じて次を順に使う。

```powershell
node --test tests/runtime_item_stack_contract.test.mjs
node --test tests/runtime_storage_contract.test.mjs
node --test tests/runtime_input_contract.test.mjs
node --test tests/runtime_map_stash_contract.test.mjs
node --test tests/runtime_dom_contract.test.mjs
npm run test:all
git diff --check
```

視覚統合を行ったSliceでは、対象fixtureの960x540と1280x720 captureも取得する。Minecraft側の意味論を変更する場合は、対応するJavaの単体テストまたはclient smokeを追加し、Inspectorだけで正当性を判断しない。

## 12. 受入ゲート

第1実装スライスは、次をすべて満たした時点で完了とする。

- 既存FixtureとURLによる表示状態が維持される。
- interaction未定義画面は従来どおりread-onlyで動作する。
- `resetRuntime()`でFixture seedと同一の初期Runtimeへ戻る。
- 同一seedと同一traceから、同一のcanonical snapshotを得る。
- insert、extract、Shift-click、organizeでItemStack数とNBT/Componentが保存される。
- stale、session不一致、境界外、容量不足の拒否時に状態が一切変わらない。
- requestとresponseの相関が一意である。
- hoverとclickの対象がviewportによらず論理座標で一致する。
- `ja_jp`/`en_us`、normal/empty/many/other、GUI-2/GUI-3を通す。
- 新規Runtimeテストがすべて成功する。
- 既存テストの新たな失敗を追加しない。

## 13. 既知の開始時ベースライン

準備時点の`npm run test:all`は63件中62件成功、1件失敗である。既知の失敗は`tests/ui_style_contract.test.mjs`のCurrency画面に`drawBackground`を要求する規則で、現在のproduction側のcustom layoutと一致していない。

この既知失敗はRuntime実装とは分離して扱う。第1スライスでは、既知の1件以外に失敗を増やさないことを回帰条件とする。規則自体の修正は、既存の未コミット変更との関係を確認した別作業にする。

## 14. 実装開始判定

以下は確定済みであり、追加の仕様確認なしにSlice Aから着手できる。

- FixtureとRuntimeの分離
- Map Stashを最初のadapterとすること
- memory backendを最初の仮想保存領域とすること
- 同期transportを既定としつつrequest/response境界を設けること
- ItemStackとNBT/Componentの保存を最優先の安全条件とすること
- 新規ファイルから開始し、既存の未コミット変更との衝突を遅らせること

Quick Moveはproduction `MapStashMenu`に確定している。storage→playerは全量収容時のみ成功し、1個でも不足すれば双方rollback、player→storageは現在filter非依存のauto-classified・non-compressing保存である。
