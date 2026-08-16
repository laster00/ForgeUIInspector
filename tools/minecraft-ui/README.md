# Minecraft UI capture harness

Minecraftを毎回ワールドへ入り直して手で操作する代わりに、分離した `run-ui` ディレクトリでForgeクライアントを起動し、固定設定・固定ウィンドウサイズでプレビュー画面をキャプチャします。

## 実行例

リポジトリルート（`ForgeUIInspector`）から実行します。

```powershell
pwsh -File tools/minecraft-ui/capture.ps1 -GuiScale 2
pwsh -File tools/minecraft-ui/capture.ps1 -GuiScale 3
```

既定値は次の通りです。

- GUIスケール2: 960×540
- GUIスケール3: 1280×720
- F7相当でCurrency Stashプレビューを開く（起動プロパティで自動化）
- 出力先: `tools/minecraft-ui/captures/`

Map Stashを撮る場合は `-PreviewKey F8` を指定します。別の大きさで比較する場合は `-Width` と `-Height` を指定できます。

`run-ui` は通常の `run` と分離され、毎回 `options.txt` を再生成します。ワールド作成は不要で、タイトル画面からF7/F8相当の開発用プレビューを起動プロパティで一度だけ開きます。これによりOSのキー入力フォーカスに依存しません。終了時にはMinecraftを閉じ、PNGと同名のJSONメタデータを残します。

このハーネスは画像を見て次の操作を判断するComputer Useの代替ではなく、同じキー・同じサイズ・同じ初期設定を再生する決定的な回帰確認用です。実際のMinecraftフォント、`GuiGraphics`、ItemStack描画はそのまま確認できます。
