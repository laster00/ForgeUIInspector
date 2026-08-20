# ForgeUIInspector Issue #4〜#8 個別実装仕様書

- 作成日: 2026-08-20
- 対象リポジトリ: `laster00/ForgeUIInspector`
- 基準branch/commit: `main` / `d64c38d3d5551db5ca8d2a226a4479fda13c65f8`
- 対象Issue: #4, #5, #6, #7, #8
- 対象外: draft PR #9 `Improve CTE2 UI audit fidelity` の6ファイルの変更

## 1. 目的

Issue #4〜#8をPR #9から分離し、各Issueを独立したレビュー単位として実装できるようにする。最終的には、AIエージェントが次を誤認せずに実行できる監査フローを提供する。

1. 常に最新のpreview asset／Fixtureを読み込む。
2. previewがproduction由来か、近似か、構想案かを機械的に判別する。
3. screen／fixture matrixを決定的に一括captureする。
4. 同一条件のbefore／afterをside-by-side、overlay、visual differenceで比較する。
5. browser previewとForge実描画を同じmetadata契約で対応づける。

## 2. PR分割と依存関係

各Issueは必ず別PRにする。PR #9の変更を混ぜない。

| 順序 | Issue | PRの責務 | 依存 |
|---:|---|---|---|
| 1 | #4 | stale asset／Fixture対策 | なし |
| 2 | #5 | preview alignment／provenance契約 | なし。#4後のrebaseを推奨 |
| 3 | #6 | browser batch captureとcapture metadata | #5のalignment metadata |
| 4 | #7 | before／after visual comparison | #6のcapture schema |
| 5 | #8 | Forge captureとのfidelity比較 | #6と#7 |

これはstacked PRとして扱ってよい。ただし各PR本文にbase Issue、前提PR、変更ファイル、テスト、既知の制約を明記する。PR #9をbaseまたは前提にしない。

## 3. 横断契約

### 3.1 後方互換性

- 既存の`file://`起動を維持する。
- `python -m http.server 8765 --directory emulator`を維持する。
- 既存の単画面URLと`window.forgeUIInspector` APIを削除しない。
- 旧version-1 project manifestに`alignment`がなくても読み込みを拒否しない。runtimeでは`approximate / undeclared`として公開する。
- `normal`、`empty`、`many`、`other`と既存screen IDを変更しない。
- CTE2本体、保存領域、NBT、Menu、通信への実行時依存を追加しない。

### 3.2 capture metadata schema

browserとForgeは次の共通schemaを使う。

```json
{
  "schema": "forge-ui-inspector.capture",
  "version": 1,
  "kind": "browser",
  "project": "cte2",
  "screen": "master_stash",
  "fixture": "many",
  "state": "normal",
  "locale": "ja",
  "variant": "rail_dual",
  "alignment": {
    "status": "production-derived",
    "source": "MasterStashPreviewScreen rail/dual geometry"
  },
  "logicalSize": { "width": 650, "height": 350 },
  "pixelSize": { "width": 960, "height": 540 },
  "guiScale": 2,
  "canonicalUrl": "index.html?...",
  "image": "browser__cte2__master_stash__many__normal__ja__rail_dual__650x350__viewport960x540__scale2.png",
  "pairKey": "cte2:master_stash:many:normal:ja:rail_dual:650x350:scale2"
}
```

必須比較fieldは`project`、`screen`、`fixture`、`state`、`locale`、`variant`、`alignment.status`、`logicalSize.width`、`logicalSize.height`、`pixelSize.width`、`pixelSize.height`、`guiScale`とする。PNGの実寸も`pixelSize`と一致しなければならない。

### 3.3 自動判定の限界

- visual differenceは不具合判定ではない。
- browser captureはMinecraft font、ItemStack、tooltip、shader、resource packを証明しない。
- Forge captureはserver、NBT、Menu、権限、production interactionを証明しない。
- limitationはmetadataと比較UIに明示し、監査レポートから消さない。

---

## 4. Issue #4 — stale preview asset／Fixtureの無効化

Issue: <https://github.com/laster00/ForgeUIInspector/issues/4>

### 4.1 完了条件

- 同じHTTP portを使い続けても、通常のページreload後に最新の`emulator.js`、`emulator.css`、Fixture JSONが反映される。
- 操作領域に`Reload assets`を設け、1回の操作で新しいcache tokenを使って再読込できる。
- Fixture fetchは開発時に`cache: no-store`を使う。
- 本番配信のcache方針とは別の開発専用挙動として文書化する。

### 4.2 実装仕様

対象:

- `emulator/index.html`
- `emulator/emulator.js`
- `tests/emulator_contract.test.mjs`
- `tests/dom_harness_contract.test.mjs`
- `README.md`

`index.html`はdocument loadごとにcache tokenを生成し、CSSとentry module URLへ`_reload=<token>`を付与する。queryに`_reload`が指定済みならそれを再利用する。

`fetchJson()`は次を満たすexport済み関数にする。

```js
fetchJson(url, {
  cacheToken,
  fetchImpl
})
```

- request URLへ`_reload`を付ける。
- `fetch(..., { cache: "no-store" })`を使う。
- testではfake fetchを注入できる。

`Reload assets`は現在URLへ新しい`_reload`を設定してnavigationする。canonical URLには`_reload`を残さない。

### 4.3 非目的

- Service Workerの導入
- production CDNのcache header制御
- Fixture schema versionの変更

### 4.4 テスト

- CSS／JS URLに`_reload`がある。
- Fixture request URLにtokenがある。
- fetch optionが`no-store`である。
- reload buttonに固定`data-testid="reload-assets"`がある。
- 既存URL正規化、paging、DOM snapshotが回帰しない。

---

## 5. Issue #5 — production alignment／provenanceの公開

Issue: <https://github.com/laster00/ForgeUIInspector/issues/5>

### 5.1 status定義

| status | 意味 |
|---|---|
| `production` | production実装そのものを直接描画する |
| `production-derived` | versioned contractまたはproduction preview class由来 |
| `approximate` | 意図と主要構造を近似するが、厳密な実画面契約ではない |
| `concept` | 設計探索用。production evidenceとして扱ってはいけない |

### 5.2 CTE2の初期宣言

| screen／variant | status | source |
|---|---|---|
| Map Stash | `production-derived` | `emulator/contracts/cte2-stash.json` |
| Currency Stash | `production-derived` | `emulator/contracts/cte2-stash.json` |
| Master `rail_dual` | `production-derived` | `MasterStashPreviewScreen rail/dual geometry` |
| Masterのその他7 variants | `concept` | `ForgeUIInspector design exploration` |
| Profession Workshop | `approximate` | `ProfessionWorkshopPreviewScreen` |
| Advanced Salvage | `approximate` | `AdvancedSalvagePreviewScreen` |

PR #9が未mergeでも、このprovenance契約は独立して追加できる。PR #9をmergeした場合も`rail_dual`のstatusを変えない。

### 5.3 公開面

同じderived valueを次へ公開する。

- preview上の`data-testid="alignment-badge"`
- canonical URLの`alignment`
- normalized stateの`alignment`
- `getSnapshot().alignment = { status, source }`
- app rootとpreview rootの`data-alignment`

URLから`alignment=production`を入力しても採用しない。manifestと現在variantから再導出する。

### 5.4 manifest validation

- checked-in CTE2 manifestでは全screenとMasterの全8 variantsを必須にする。
- generatorは新規projectへ`approximate / generated project fixture`を出力する。
- `alignment`を持つmanifestではstatusとsourceを検証する。
- 旧manifestでfield自体がない場合はruntime fallbackを使い、version-1 compatibilityを壊さない。
- `rail_dual`宣言の欠落をcontract testで検出する。

### 5.5 テスト

- CTE2 5画面に有効statusがある。
- Master 8 variantsがすべて宣言される。
- `current === concept`、`rail_dual === production-derived`を固定する。
- concept URLをproductionへ偽装できない。
- badge、snapshot、DOM dataset、canonical URLが同じstatusを示す。

---

## 6. Issue #6 — screen／fixture matrixのbatch capture

Issue: <https://github.com/laster00/ForgeUIInspector/issues/6>

### 6.1 CLI

```text
npm run capture:browser -- \
  --screens all \
  --fixtures normal,empty,many,other \
  --locales ja \
  --states normal \
  --scale 2 \
  --viewport 960x540
```

追加option:

- `--project <id>`
- `--screens <csv>`
- `--fixtures <csv>`
- `--locales <csv>`
- `--states <csv>`
- `--variants <csv>`
- `--all-master-variants`
- `--scale <number>`
- `--viewport <width>x<height>`
- `--browser <path>`または`FORGE_UI_BROWSER`
- `--output <directory>`

外部npm packageを追加しない。Chromium／Edge／Chromeのheadless modeを使い、静的serverはNode標準`http`で起動する。

### 6.2 capture mode

`capture=1`のときだけ次を行う。

- 操作領域とalignment badgeを画像から除外する。
- browser viewport中央へ論理previewを配置する。
- 通常previewのDOMやURL操作は変更しない。
- canonical URLから`capture=1`を除外する。

### 6.3 成果物

各captureにつきPNGと同basenameのJSONを生成する。basenameは次の順で固定する。

```text
<kind>__<project>__<screen>__<fixture>__<state>__<locale>__<variant>__<logical-size>__<viewport>__<scale>
```

directory直下へ`capture-manifest.json`を生成し、`requested`、`captured`、`failed`と各結果を記録する。次をfailureとして明示する。

- browserが見つからない。
- headless processが非0終了する。
- DOMに`data-ready="true"`がない。
- PNGが生成されない、PNG signatureがない、極端に小さい。
- PNG実寸が要求viewportと異なる。

失敗が1件でもあればmanifestを保存した後にprocess exit codeを1にする。

### 6.4 テスト

- matrix展開順が決定的である。
- stable filenameに全metadata dimensionが入る。
- Master variantのalignmentが正しく選ばれる。
- capture metadataがschema validationを通る。
- 既存単画面capture／URL確認を削除しない。

---

## 7. Issue #7 — before／after visual comparison

Issue: <https://github.com/laster00/ForgeUIInspector/issues/7>

### 7.1 UI

`tools/visual-compare/index.html`を静的に開いて使う。左右それぞれにPNGと同名JSONを指定する。

mode:

1. `side-by-side`: 左右を同じscaleで並べる。
2. `overlay`: 左を100%、右をslider指定alphaで重ねる。
3. `difference`: channel差がthresholdを超えたpixelだけ赤く強調する。

### 7.2 preflight validation

描画前に共通capture schemaと必須比較fieldを検証する。mismatchが1つでもあればcanvasを更新せず、field名と左右値を表示する。PNG実寸がmetadataの`pixelSize`と異なる場合、または左右PNG実寸が異なる場合も拒否する。

### 7.3 difference semantics

- threshold既定値は16、範囲は0〜255。
- RGBA各channelの最大絶対差がthresholdを超えたpixelをchangedとする。
- `changedPixels`、`totalPixels`、`ratio`、`threshold`を保存する。
- UIとmetadataに「pixel differenceは自動的なproduct defectではない」と明記する。

### 7.4 保存

`Save PNG + metadata`で比較PNGとJSONを保存する。comparison JSONはsource kind／image、mode、difference metric、interpretationを含む。

### 7.5 テスト

- metadata mismatchを拒否する。
- threshold以下の差をnoiseとして非強調にする。
- threshold超過pixelだけchanged countへ入る。
- comparison metadataに自動不具合判定ではない旨が残る。

---

## 8. Issue #8 — browser previewとForge captureのfidelity比較

Issue: <https://github.com/laster00/ForgeUIInspector/issues/8>

### 8.1 Forge capture入力

```powershell
pwsh -File tools/minecraft-ui/capture.ps1 \
  -GuiScale 2 \
  -PreviewKey F9 \
  -Fixture many \
  -Locale ja \
  -Width 960 \
  -Height 540
```

`Fixture`は`normal`、`empty`、`many`、`other`。`Locale`は`ja`、`en`。capture harnessは次をGradle system propertyとMinecraft `options.txt`へ渡す。

- `forgeuiinspector.preview`
- `forgeuiinspector.fixture`
- `lang:ja_jp`または`lang:en_us`
- `guiScale`

Java previewは起動時のfixture indexをpropertyから設定する。手動で右キーを押さなくても指定fixtureが最初から描画されなければならない。

### 8.2 Forge PNG geometry

- outer windowではなくMinecraft client areaをcaptureする。
- PNG実寸を`pixelSize`へ記録する。
- requested viewportと実client sizeが異なる場合、metadataへ実測値を残す。
- visual compare側がbrowserとのgeometry mismatchを明示する。

### 8.3 screen mapping

| PreviewKey | screen | variant | alignment |
|---|---|---|---|
| F7 | `currency_stash` | null | `production-derived` |
| F8 | `map_stash` | null | `production-derived` |
| F9 | `master_stash` | `rail_dual` | `production-derived` |
| F10 | `profession_workshop` | null | `approximate` |
| F11 | `advanced_salvage` | null | `approximate` |

### 8.4 pairing

browserとForge metadataは同じ論理状態から同じ`pairKey`を生成する。visual compareはkindが異なっても、必須比較fieldとpixel geometryが一致すれば比較できる。

browser metadataにはmatching Forge captureが未添付である制約を既定で入れる。Forge metadataにはserver／NBT／Menu／production interactionを証明しない制約を入れる。比較レポートはこれらを統合して表示する。

### 8.5 非目的

- production MODへcapture codeを組み込むこと
- gameplay、network、storage mutationの自動化
- browserとForgeのpixel差をCI failureへ直結すること
- tooltipやhoverを初期版の必須matrixにすること

### 8.6 テスト

- 全F7〜F11がscreen metadataへ一意に対応する。
- `forgeUiFixture`がGradle run propertyへ渡る。
- Map／Currency／FixturePreviewScreenが起動fixtureを読む。
- metadataに共通schemaの必須field、`pairKey`、limitationsがある。
- screenshotがclient area由来である。
- browser／Forgeのfixture、locale、variant、logical size、scale mismatchが比較前に検出される。

---

## 9. 検証コマンド

```text
npm run test:all
python .codex/skills/forge-ui-fixture-generator/scripts/generate_fixture.py validate emulator/projects/cte2
git diff --check
```

Java／Forge環境:

```text
./gradlew test
./gradlew build
```

Windows実画面:

```powershell
pwsh -File tools/minecraft-ui/capture.ps1 -GuiScale 2 -PreviewKey F7 -Fixture normal -Locale ja
pwsh -File tools/minecraft-ui/capture.ps1 -GuiScale 2 -PreviewKey F8 -Fixture empty -Locale ja
pwsh -File tools/minecraft-ui/capture.ps1 -GuiScale 2 -PreviewKey F9 -Fixture many -Locale ja
```

browser側も同じGUI scale、viewport、screen、fixture、locale、variantでcaptureし、visual compareへ入力する。

## 10. Definition of Done

各Issue PRは次をすべて満たす。

- 対象Issue以外の責務を混ぜていない。
- PR #9のfixture label、empty state、Master rail/dual footer変更を含まない。
- `npm run test:all`が成功する。
- `git diff --check`が成功する。
- Gradleを実行できる環境では`./gradlew test`と`./gradlew build`が成功する。
- 新しいpublic state／metadata fieldがREADMEとこの仕様に一致する。
- 旧project manifest、単画面URL、`file://` fallbackが壊れていない。
- agentがconceptをproduction-derivedと誤認できない。
- missing Forge evidenceとvisual differenceの限界が明示される。
