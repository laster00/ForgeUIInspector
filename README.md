# Forge UI Inspector

Forge 1.20.1 / Java 17 向けの開発専用クライアント MOD です。実ゲームの `GuiGraphics`、Minecraft のフォント、バニラ ItemStack 描画を使って、Map Stash の画面レイアウトを確認できます。

## 操作

- **F8**: どのゲーム内画面からでもプレビューを開く
- 右上の Fixture ボタンをクリック: フィクスチャを切り替える（Normal / Empty / Many items / Other）
- 左側リストをクリック: レイアウトを選択し、中央見出しと件数を確認する
- **左右矢印**: フィクスチャを切り替える
- 左側でホイール: レイアウト一覧をスクロール
- 中央でホイール: 54個を超えるフィクスチャのページ切り替え
- **Esc**: 元の画面へ戻る

## 開発

Java 17 を `JAVA_HOME` に設定後、`./gradlew test` と `./gradlew build` を実行してください。ForgeGradle が Forge 1.20.1-47.4.22 を取得します。

この実装は **プレビュー専用で、実際の MapStash 連携・保存・ネットワーク処理はまだありません**。MapStash本体とは独立した固定フィクスチャを使う、実機の実描画確認に使う開発MODです。サーバー側のゲームプレイ動作や CTE2 クラスには依存しません。

## ブラウザUIエミュレータ

Minecraftを起動せずMap Stashのレイアウト・長い文字・空状態・ページングを確認できます。

次のどちらかで開けます。

1. `emulator/index.html` をブラウザで直接開く（`file://`）。
2. `python -m http.server 8765 --directory emulator` を実行し、`http://127.0.0.1:8765/` を開く。

URL例: `index.html?fixture=many&locale=ja&layout=all&page=1&scroll=0&width=960&height=540&scale=2&state=normal`

再現可能なURLパラメータは `fixture`（`normal|empty|many|other`）、`locale`（`ja|en`）、`layout`、`page`、`scroll`、`width`、`height`、`scale`、`state`（`normal|loading|full|stale|unsupported`）です。不正値や範囲外の値は安全な既定値へ正規化されます。

開発者コンソールでは次のAPIを使えます。

```js
window.forgeUIInspector.getState()
window.forgeUIInspector.setState({ fixture: "many", page: 1 })
window.forgeUIInspector.reset()
window.forgeUIInspector.getCanonicalUrl()
```

外部依存はなく、file://でFixtureを取得できない場合も内蔵フォールバックで4種類の状態を表示します。ブラウザのフォント・アイコンはMinecraftの実描画とは異なるため、最終的な可読性は既存のF8 Forgeプレビューで確認してください。NBT、通信、権限、実際の収納処理は再現しません。
