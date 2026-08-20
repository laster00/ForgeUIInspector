# Forge UI Inspector — UIエミュレータ仕様書

## 1. 目的

Minecraftを起動せずに、Forge MODの画面レイアウトと文字の見え方を高速に確認できる開発用エミュレータを提供する。

日常のUI調整はブラウザ上のエミュレータで行い、最後に一度だけForgeクライアントで実描画を確認する。エミュレータを本番MODや配布用MODPACKへ同梱することはしない。

### 解決する問題

- Minecraftの起動・ワールド読み込みをUI変更のたびに繰り返さない
- AIエージェントがURLと固定データだけで同じ画面状態を再現できる
- 画面幅、GUIスケール、長い日本語、空状態、ページングを短時間で比較する
- ブラウザのスクリーンショットをレビュー・回帰確認に使える

## 2. 役割分担

| 層 | 目的 | 起動 | 信頼できる範囲 |
|---|---|---|---|
| ブラウザエミュレータ | 日常のレイアウト・文字・状態確認 | 数秒以内。静的HTMLを開くかローカルサーバー | 座標、余白、文字切り詰め、状態遷移、ページング |
| Forgeプレビュー画面 | Minecraftの実フォント・GuiGraphics・ItemStack描画確認 | 最終確認時に一度だけForgeクライアントを起動 | Minecraft固有の描画、実GUIスケール、実リソースパックとの相互作用 |

ブラウザ側を正としすぎない。ブラウザで合格した後、Forgeプレビューで最終確認する。

## 3. 非目的と妥協点

エミュレータでは次を再現しない。

- ForgeのMenu、サーバー通信、BlockEntity、NBT、ItemStack移動の実動作
- Mine and Slash、Dungeon Realm、Sophisticated Storageとの接続
- 実際のMinecraftフォントテクスチャの完全なピクセル一致
- リソースパック、シェーダー、他MODによる描画差
- 実アイテムのNBTホバーツールチップ
- 実ゲームのクリック権限・セッション・revision検証

アイテムは、初期版では簡易アイコンまたは短い識別文字でよい。重要なのはスロットの大きさ、配置、個数表示、文字の収まりである。

## 4. 起動要件

### 必須方針

- HTML / CSS / JavaScriptのみで動作する
- Node.js、Gradle、Forge、外部Webサービスを必須にしない
- 外部CDNやリモートフォントへ依存しない
- `file://`で開いても動作する。必要に応じて次のローカルサーバーでも動作する

```text
python -m http.server 8765 --directory emulator
```

- 本番MODのJARには含めない

### 推奨ディレクトリ

```text
ForgeUIInspector/
  emulator/
    index.html
    emulator.css
    emulator.js
    fixtures/
      map-stash.json
  docs/
    forge-ui-emulator-spec.md
  tests/
    emulator_contract.test.mjs
```

## 5. エミュレータ画面の構成

ブラウザ画面は、開発者用の操作領域と、Minecraftを模したプレビュー領域を分離する。

### 5.1 開発者用操作領域

プレビューの外側に置く。Minecraft画面の一部として扱わない。

- Fixture選択: `normal` / `empty` / `many` / `other`
- 言語選択: `ja` / `en`
- プレビュー幅・高さ
- GUIスケール
- 選択レイアウト
- ページ番号
- 「URLをコピー」または現在状態のURL表示
- 「状態をリセット」

### 5.2 Minecraftプレビュー領域

基準論理サイズは **320×230** とする。ブラウザ上では整数倍表示を優先し、必要な場合だけ縮小する。

```text
┌────────────────────────────────┐
│ タイトル             選択状態 │
│                                │
│ 左: レイアウト一覧 │ 中央: 9×6 │
│     件数付き        │ スロット  │
│     ホイール対応    │ ページ表示│
│                                │
│                    インベントリ │
│                    ホットバー   │
└────────────────────────────────┘
```

#### 必須要素

- Minecraft調の暗いパネル
- 左側のレイアウト一覧
- 「すべて」、動的レイアウト、 「その他」
- レイアウト名と件数
- 左一覧のホイールスクロール
- 中央の9×6スロット
- 54件を超える場合だけページ表示
- 下部のプレイヤー3×9インベントリと9スロットのホットバー
- ItemStackの簡易アイコンと個数
- 長い文字のpixel幅によるclip

#### 作らない要素

- 検索欄
- ティアー欄
- レアリティ欄
- 詳細パネル
- 収納・整理・取り出しボタン
- 追加の識別アイコン

エミュレータの外側にあるFixture選択UIを、Minecraftプレビュー内のUIと混同させない。

## 6. 表示トークン

既存のCTE2 UI方針と同じ値を初期値とする。

| 用途 | 値 |
|---|---|
| 全体背景 | `#20242B` |
| パネル | `#151E28` |
| 境界線 | `#38536A` |
| スロット外枠 | `#8B8B8B` |
| スロット内側 | `#373737` |
| 通常文字 | `#E7EDF3` |
| 補助文字 | `#AAC3D8` |
| 選択・強調 | `#F0B45B` |
| 成功 | `#78D39A` |
| エラー | `#E27A7A` |

- 基本間隔は8px
- 論理スロットは18×18px
- クリック可能な行は最低18px高
- 文字は折り返さず、指定幅を超えた部分をclipする
- ブラウザ拡大率に依存しないよう、プレビュー内部は整数ピクセルを優先する

## 7. Fixture仕様

ブラウザとForgeプレビューが別々にフィクスチャを持つと表示がずれるため、最終的には1つのJSONを正とする。

### 7.1 ファイル

```text
emulator/fixtures/map-stash.json
```

Forge側のリソースへはビルド時にコピーする。ブラウザは同じ内容を読み込む。初期実装でコピー処理がまだない場合も、データ構造は同じにする。

### 7.2 スキーマ

```json
{
  "version": 1,
  "screen": "map_stash",
  "pageSize": 54,
  "fixtures": [
    {
      "id": "normal",
      "titleKey": "screen.forgeuiinspector.normal",
      "layouts": [
        {
          "id": "all",
          "labelKey": "screen.forgeuiinspector.all",
          "count": 18
        },
        {
          "id": "layout_01",
          "labelKey": "screen.forgeuiinspector.layout.long",
          "count": 4
        }
      ],
      "items": [
        { "slot": 0, "icon": "map", "count": 1 },
        { "slot": 1, "icon": "paper", "count": 2 }
      ]
    }
  ]
}
```

### 7.3 必須Fixture

- `normal`: 日本語の長いレイアウト名を含む通常状態
- `empty`: 0件
- `many`: 55件以上。2ページ以上
- `other`: 不明／その他に件数を持つ状態

### 7.4 Fixtureの不変条件

- レイアウトIDは一意
- `pageSize`は54
- スロット番号は0以上54未満
- 件数は0以上
- `many`は少なくとも55件
- 未知のfixture、レイアウト、アイコンは画面を壊さずフォールバック表示する

## 8. URLによる状態再現

AIエージェントが同じ画面を再現できるよう、すべての主要状態をクエリ文字列で指定する。

```text
emulator/index.html?fixture=many&locale=ja&layout=all&page=1&scroll=0&width=960&height=540&scale=2
```

### パラメータ

| パラメータ | 値 | 既定値 |
|---|---|---|
| `fixture` | `normal`, `empty`, `many`, `other` | `normal` |
| `locale` | `ja`, `en` | `ja` |
| `layout` | レイアウトID | `all` |
| `page` | 0以上の整数 | `0` |
| `scroll` | 0以上の整数 | `0` |
| `width` | 論理画面幅 | `960` |
| `height` | 論理画面高さ | `540` |
| `scale` | 正の数 | `2` |
| `state` | `normal`, `loading`, `full`, `stale`, `unsupported` | `normal` |

不正な値は安全な既定値へ戻す。URLを正規化し、現在の状態を再現可能なURLとして表示する。

## 9. エージェント向けインターフェース

### 9.1 DOM識別子

主要要素に固定の`data-testid`を付ける。

```text
forge-ui-emulator
project-control
screen-control
map-stash-preview
extended-preview
layout-list
layout-row-<id>
stash-grid
stash-slot-<index>
generic-slot-<index>
stash-page
player-inventory
fixture-control
locale-control
```

### 9.2 JavaScript API

ブラウザコンソールや自動操作から次を呼べるようにする。

```js
window.forgeUIInspector.getState()
window.forgeUIInspector.setState({ project: "cte2", fixture: "many", page: 1 })
window.forgeUIInspector.reset()
window.forgeUIInspector.getCanonicalUrl()
window.forgeUIInspector.getSnapshot()
```

`getState()`は、表示中のfixture、locale、layout、page、scroll、viewport、状態名をJSONで返す。
`getSnapshot()`は、`state`、正規化済み`canonicalUrl`、project/screenメタデータ、選択中fixtureの`itemCount`・`layoutCount`・`pageSize`・`pageCount`を含む。画面ルートには同じ状態を表す`data-project`、`data-screen`、`data-fixture`、`data-state`、`data-layout`、`data-page`、`data-page-count`、`data-item-count`を付与する。`data-testid="inspector-state"`の非表示`output`にもJSON文字列を保持し、DOMだけを読むエージェントからも状態を取得できるようにする。

### 9.3 エージェントの標準確認手順

1. URLで状態を固定する
2. `data-testid`でレイアウト一覧・ページ・スロットを確認する
3. スクリーンショットを取得する
4. `getState()`でURLと表示状態が一致することを確認する
5. 文字のはみ出し、重なり、空状態、ページ境界を報告する

## 10. 状態と操作

### 通常操作

- 左一覧クリック: レイアウトを選択し、ページを0へ戻す
- 左一覧ホイール: 一覧を上下にスクロール
- 中央ホイール: ページを切り替える
- ページ変更: 0未満、最大ページ超過を許可しない
- Fixture変更: エミュレータ外側の操作領域で行う

### 表示状態

- 初期同期
- 通常
- 空
- 満杯
- 55件以上のページング
- 不明／その他
- 未対応アイテム
- stale表示
- loading表示

状態表示は画面構造を変えず、既存パネル内の補助文言・色・スロット状態だけで表現する。

## 11. テスト

### 自動テスト

Node.js組み込みの`node:test`だけで次を確認する。

- Fixtureスキーマの不変条件
- 28レイアウト＋「すべて」＋「その他」の件数
- 54件、55件、108件のページ数
- ページ・スクロールのclamp
- URLパラメータの正規化
- 日本語・英語の翻訳キー解決
- 長いラベルのclip幅
- レイアウト変更時のページリセット

### 目視確認

最低限、次のURLをスクリーンショットで確認する。

```text
?fixture=normal&locale=ja
?fixture=empty&locale=ja
?fixture=many&locale=ja&page=1
?fixture=other&locale=en
?fixture=normal&locale=ja&width=640&height=360&scale=2
```

ブラウザ確認で合格した後、ForgeのF8プレビューを一度だけ起動して、実フォントと実アイテム描画の差を確認する。

## 12. 完了条件

- Minecraftを起動せずに4Fixtureと日英表示を確認できる
- URL一つで同じ状態を再現できる
- 320×230基準の全要素が小さい画面でもはみ出さない
- 長い日本語が隣接要素へ侵入しない
- 54件と55件の境界でページ表示が正しい
- レイアウト変更時にページが0へ戻る
- `node --test`が成功する
- 既存Forgeプロジェクトの`test`/`build`を壊さない
- Forgeクライアント起動は最終確認時の1回に限定できる

## 13. 将来拡張

- Advanced Salvage、Master Stash、Profession WorkshopのFixture追加
- JSON Schemaによるfixture検証
- Playwrightまたはブラウザ自動撮影の任意導入
- Forge側が同じFixture JSONを直接読む仕組み

## 付録: プロジェクト単位のFixture登録

この仕様の初期CTE2 Fixtureは後方互換のため `emulator/fixtures/` に残す。汎用運用では `emulator/projects/index.json` にプロジェクトを登録し、`emulator/projects/<project-id>/project.json` から画面・renderer・論理サイズ・Fixture相対パスを解決する。

プロジェクト外のFixtureをCTE2ファイルへ追加してはいけない。新規プロジェクトは同梱の `.codex/skills/forge-ui-fixture-generator` で生成し、`docs/forge-ui-fixture-system.md` のスキーマ検証を通す。未知のrendererは汎用の読み取り専用プレビューへフォールバックし、既存の `?screen=...` URLは `cte2` プロジェクトとして解釈する。
- 差分スクリーンショットによる回帰テスト
- 実際のMinecraftアイコン画像を開発用アセットとして差し替える機能
