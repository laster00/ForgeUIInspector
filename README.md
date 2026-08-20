# Forge UI Inspector

Forge UI Inspectorは、Minecraftを起動せずにForge/Minecraft UIのレイアウトを確認するための開発ツールです。ブラウザエミュレータを日常の調整に使い、最後にForgeの実プレビューでMinecraftフォント・`GuiGraphics`・ItemStack描画を確認します。

CTE2の画面は同梱プロジェクトの一例です。Fixtureと画面定義をプロジェクト単位で追加できるため、別のMinecraft MODやMODPACKのUIにも利用できます。

## まずブラウザで確認する

依存パッケージを追加せず、次のどちらかで起動できます。

1. `emulator/index.html`をブラウザで直接開く（`file://`）。
2. リポジトリのルートで次を実行し、`http://127.0.0.1:8765/`を開く。

```text
python -m http.server 8765 --directory emulator
```

HTTPサーバーではプロジェクト一覧と各プロジェクトのFixtureを読み込みます。`file://`ではFetch制限により既定のCTE2 Fixtureへフォールバックします。カスタムプロジェクトを確認するときはHTTPサーバーを使ってください。

## プロジェクトとFixture

プロジェクト一覧、画面定義、Fixtureを分離して管理します。

```text
emulator/
  projects/
    index.json
    <project-id>/
      project.json
      fixtures/<screen-id>.json
  fixtures/                    # 既定CTE2の互換パス
```

- `emulator/projects/index.json`: プロジェクトの登録と表示順
- `project.json`: 画面ID、表示名キー、renderer、論理サイズ、Fixture相対パス
- `<screen-id>.json`: `normal`、`empty`、`many`、`other`の決定的な表示データ

同梱のCTE2定義は [emulator/projects/cte2/project.json](emulator/projects/cte2/project.json) です。スキーマの詳細は [Fixture system仕様](docs/forge-ui-fixture-system.md) と [Fixture schemaリファレンス](.codex/skills/forge-ui-fixture-generator/references/fixture-schema.md) を参照してください。

### 新しいプロジェクトを作る

同梱の `$forge-ui-fixture-generator` Skill、または次の標準ライブラリのみの生成スクリプトを使います。

```text
python .codex/skills/forge-ui-fixture-generator/scripts/generate_fixture.py init --project-id demo --project-label-key project.demo.name --screen-id inventory --screen-label-key screen.demo.inventory --renderer generic --width 360 --height 240 --columns 9 --rows 6 --output emulator/projects/demo
python .codex/skills/forge-ui-fixture-generator/scripts/generate_fixture.py validate emulator/projects/demo
```

生成後、`emulator/projects/index.json`へ登録してください。Fixtureの上書きが必要な場合だけ`--force`を指定します。生成値には乱数・現在時刻・ネットワーク・バイナリ資産を使用しません。

### renderer

`compact-stash`、`master-stash`、`profession-workshop`、`advanced-salvage`は既定CTE2プレビューを使用します。Map／Currencyは474×326・12列×8行（96スロット）、Master Stashは81スロットです。未知のrendererは画面契約由来のスロット数で表示する汎用rendererへ安全にフォールバックします。

## 再現可能なURLとAPI

URLに状態をすべて含められます。

```text
index.html?project=cte2&screen=advanced_salvage&fixture=many&locale=ja&layout=all&page=1&scroll=0&width=960&height=540&scale=2&state=normal
```

主なパラメータ:

- `project`: プロジェクトID（省略時は`cte2`）
- `screen`: プロジェクト内の画面ID
- `fixture`: `normal` / `empty` / `many` / `other`
- `locale`: `ja` / `en`
- `layout`: 選択中のレイアウトまたはカテゴリ
- `page`、`scroll`: ページ番号と左一覧スクロール位置
- `width`、`height`、`scale`: 論理画面サイズとGUIスケール
- `state`: `normal` / `loading` / `full` / `stale` / `unsupported`

不正値や範囲外の値は安全な既定値へ正規化されます。既存の`?screen=map_stash`形式はCTE2プロジェクトとしてそのまま利用できます。

ブラウザの開発者コンソールでは次のAPIを使えます。

```js
window.forgeUIInspector.getState()
window.forgeUIInspector.setState({ project: "cte2", screen: "advanced_salvage", fixture: "many", page: 1 })
window.forgeUIInspector.reset()
window.forgeUIInspector.getCanonicalUrl()
window.forgeUIInspector.getSnapshot()
```

非CTE2プロジェクトの`getState()`には`project`が含まれます。画面やプロジェクトを切り替えると、対応するmanifestとFixtureを再読込します。
`getSnapshot()`は状態、正規化済みURL、画面の論理サイズ、renderer、選択中Fixtureの件数・ページ数をまとめた機械可読JSONを返します。画面のルートには`data-project`、`data-screen`、`data-fixture`、`data-state`、`data-page`、`data-page-count`、`data-item-count`も付与され、`data-testid="inspector-state"`の非表示`output`から同じスナップショットを取得できます。

## Forge実プレビュー

Forge 1.20.1 / Java 17向けの開発専用クライアントMODです。タイトル画面でも次のキーを受け付けるため、ワールドを作成せず実フォントと実描画を確認できます。

- **F7**: Currency Stash
- **F8**: Map Stash
- **F9**: Master Stash
- **F10**: Profession Workshop
- **F11**: Advanced Salvage
- **Esc**: プレビューを閉じる

右上のFixture切り替え、左右キー、レイアウト選択、ホイールによる一覧スクロールとページ切り替えに対応しています。固定キャプチャは [tools/minecraft-ui/README.md](tools/minecraft-ui/README.md) の`run-ui` / `capture.ps1`を使います。GUIスケール2（960×540）と3（1280×720）を確認できます。

ForgeプレビューはUI確認専用です。Map StashやMine and Slashの保存領域、NBT、通信、権限、実際の収納処理には接続しません。

## 開発とテスト

Java 17を`JAVA_HOME`に設定して実行します。

```text
./gradlew test
./gradlew build
```

ブラウザとFixtureの契約テスト:

```text
npm run test:all
python .codex/skills/forge-ui-fixture-generator/scripts/generate_fixture.py validate emulator/projects/cte2
```

ブラウザ側はMinecraftの配布フォントを同梱せず、固定ピクセル系のフォントスタックで近似します。文字幅と最終的な可読性はForge実プレビューで確認してください。

ForgeUIInspector単体でテストできます。CTE2の実装リポジトリが同じワークスペースにある場合だけ、追加のUIスタイル統合契約が有効になります。エミュレータ本体やForgeプレビューは`cte2-ja-patch`を実行時依存にしません。

CTE2 stash geometryの通常checkout向け正本は`emulator/contracts/cte2-stash.json`です。production Java sourceが同じワークスペースにある場合は`python tools/export_cte2_stash_contract.py --check`でexportの鮮度を確認でき、更新時は同コマンドから`--check`を外します。sourceがないcheckoutでもテストはversioned exportを必須入力として実行されます。

## CTE2 UIスタイル

CTE2の各画面は暗色パレット、18pxスロット、Minecraftフォント、ピクセル幅クリップを共有します。画面名と互換性IDは [CTE2拡張カタログ](docs/cte2-extension-catalog.md)、UI規約は [プロジェクトローカルスキル](.codex/skills/cte2-ui-style/SKILL.md) と [トークン・レイアウト仕様](.codex/skills/cte2-ui-style/references/ui-style-tokens.md) を正とします。
