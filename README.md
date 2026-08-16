# Forge UI Inspector

Forge 1.20.1 / Java 17 向けの開発専用クライアント MOD です。実ゲームの `GuiGraphics`、Minecraft のフォント、バニラ ItemStack 描画を使って、CTE2拡張5画面のレイアウトを確認できます。

## 操作

- **F8**: Map Stashプレビューを開く
- **F7**: Currency Stashプレビューを開く（固定のバニラItemStackによるUIプロトタイプ）
- **F9**: Master Stashプレビューを開く
- **F10**: Profession Workshopプレビューを開く
- **F11**: Advanced Salvageプレビューを開く
- 右上の Fixture ボタンをクリック: フィクスチャを切り替える（Normal / Empty / Many items / Other）
- 左側リストをクリック: レイアウトを選択し、中央見出しと件数を確認する
- **左右矢印**: フィクスチャを切り替える
- 左側でホイール: レイアウト一覧をスクロール
- 中央でホイール: 54個を超えるフィクスチャのページ切り替え
- **Esc**: 元の画面へ戻る

## 開発

Java 17 を `JAVA_HOME` に設定後、`./gradlew test` と `./gradlew build` を実行してください。ForgeGradle が Forge 1.20.1-47.4.22 を取得します。

この実装は **プレビュー専用で、実際の MapStash 連携・保存・ネットワーク処理はまだありません**。MapStash本体とは独立した固定フィクスチャを使う、実機の実描画確認に使う開発MODです。サーバー側のゲームプレイ動作や CTE2 クラスには依存しません。

タイトル画面でもF7〜F11を受け付けるため、ワールドを作成せずに実フォントと `GuiGraphics` の確認ができます。固定設定で画像を取りたい場合は `tools/minecraft-ui/capture.ps1` を使ってください。GUIスケール2（960×540）と3（1280×720）の起動、起動プロパティによるプレビュー表示、ウィンドウキャプチャ、終了までを自動化し、通常の `run` とは分離した `run-ui` を使います。詳しくは [tools/minecraft-ui/README.md](tools/minecraft-ui/README.md) を参照してください。

## ブラウザUIエミュレータ

Minecraftを起動せず、Map Stash、Currency Stash、Master Stash、Profession Workshop、Advanced Salvageのレイアウト・長い文字・空状態・ページングを確認できます。拡張3画面はサーバーやMine and Slashの保存領域へ接続しない読み取り専用Fixtureです。

次のどちらかで開けます。

1. `emulator/index.html` をブラウザで直接開く（`file://`）。
2. `python -m http.server 8765 --directory emulator` を実行し、`http://127.0.0.1:8765/` を開く。

URL例: `index.html?screen=advanced_salvage&fixture=many&locale=ja&layout=all&page=1&scroll=0&width=960&height=540&scale=2&state=normal`

再現可能なURLパラメータは `screen`（`map_stash|currency_stash|master_stash|profession_workshop|advanced_salvage`、省略時はMap）、`fixture`（`normal|empty|many|other`）、`locale`（`ja|en`）、`layout`（CurrencyではカテゴリID）、`page`、`scroll`、`width`、`height`、`scale`、`state`（`normal|loading|full|stale|unsupported`）です。不正値や範囲外の値は安全な既定値へ正規化されます。

開発者コンソールでは次のAPIを使えます。

```js
window.forgeUIInspector.getState()
window.forgeUIInspector.setState({ screen: "advanced_salvage", fixture: "many", page: 1 })
window.forgeUIInspector.reset()
window.forgeUIInspector.getCanonicalUrl()
```

外部依存はなく、file://でFixtureを取得できない場合も内蔵フォールバックで4種類の状態を表示します。ブラウザ側はMinecraftの配布フォントを同梱せず、固定ピクセル系フォントスタックで近似します。文字幅と最終的な可読性は、Minecraftの実フォントを使うF7〜F11 Forgeプレビューで確認してください。NBT、通信、権限、実際の収納処理は再現しません。

## CTE2 UIスタイル

Map Stash、Currency Stash、Master Stash、Profession Workshop、Advanced Salvageは共通の暗色パレット、18pxスロット、Minecraftフォント、ピクセル幅クリップを使います。表示名と互換性IDの対応は [CTE2拡張カタログ](docs/cte2-extension-catalog.md) を正とし、UI規約は [プロジェクトローカルスキル](.codex/skills/cte2-ui-style/SKILL.md) と [トークン・レイアウト仕様](.codex/skills/cte2-ui-style/references/ui-style-tokens.md) にまとめています。ブラウザ側の `UI_THEME` とMinecraft側の `Cte2UiTheme` を同時に更新し、`npm run test:all` で契約を確認してください。
