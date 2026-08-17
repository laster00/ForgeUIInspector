# CTE2拡張カタログ

このカタログを、MOD一覧・画面タイトル・ブロック／アイテム名の基準にする。既存ワールドと既存設定を守るため、互換性IDは変更しない。

| 機能 | MOD ID（固定） | 英語表示名 | 日本語表示名 | 主な画面／対象 |
| --- | --- | --- | --- | --- |
| 共通ヘルパー | `cte2_talent_description_search` | CTE2 Helper Suite | CTE2補助機能 | タレント検索、共通Mixin |
| マップ保管庫 | `cte2_map_stash` | CTE2 Map Stash | CTE2 マップ保管庫 | `cte2_map_stash:map_stash` |
| 通貨保管庫 | `cte2_currency_stash` | CTE2 Currency Stash | CTE2 通貨保管庫 | `cte2_currency_stash:currency_stash` |
| マスタースタッシュ | `cte2_master_stash` | CTE2 Master Stash | CTE2 マスタースタッシュ | `master_stash_backpack` |
| 職能工房 | `cte2_profession_workshop` | CTE2 Profession Workshop | CTE2 職能工房 | `profession_workshop` |
| 高度サルベージ | `cte2_advanced_salvage` | CTE2 Advanced Salvage | CTE2 高度サルベージ | F8のプリセット画面 |

## 命名規則

- 互換性が必要な値（MOD ID、登録名、NBTキー、ネットワークチャネル、Mixin設定名、既存の翻訳キー）は変更しない。
- 新しい表示名は `CTE2 <Feature>`、日本語は `CTE2 <機能名>` を基本形にする。
- Stash系の日本語は「保管庫」または「マスタースタッシュ」に統一し、同じ画面内で「倉庫」「バッグ」などを混在させない。
- Advanced Salvageの機能名は「高度サルベージ」。自動判定であることは説明文やキー操作説明で補足する。
- Javaパッケージは `jp.cte2.<feature>`、共有UIは `jp.cte2.client.ui`、共有保存定数は `jp.cte2.storage` に置く。
- Map／Currency Stashの物理容量は243、表示ページは54スロット。画面座標は共有レイアウト定数を使う。

## 変更手順

表示名を変更するときは、次を同じ変更に含める。

1. `src/main/resources/META-INF/mods.toml` の `displayName` と `description`
2. 対応する `assets/<modid>/lang/en_us.json` と `ja_jp.json`
3. ForgeUIInspectorのFixture、README、スクリーンショットURL
4. このカタログと、必要ならローカルの `cte2-ui-style` スキル

登録IDや保存形式を変更する必要がある場合は、名称変更として扱わず、移行設計と互換テストを先に作る。
