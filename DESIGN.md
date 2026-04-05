# DESIGN.md — dræm. ダッシュボード 設計思想

Codexがダッシュボードを改修・拡張する前に必ず読むこと。
「なぜこの設計か」が分からないと壊す。

---

## 一言で言うと

**「Ryuが音楽を作り続けるための、摩擦ゼロの管理ツール」**

管理のために時間を使わせない。見て、触って、戻る。それだけ。

---

## Ryuとは

- 会社員 × 音楽アーティスト（dræm.）の二足のわらじ
- 週4〜5時間しか制作時間がない
- 目標：2029年に音楽で生計を立てる
- このダッシュボードは「毎日開くスタート地点」

---

## デザイン原則（絶対に守る）

### 1. 黒背景・ゴールドアクセント
```css
--bg: #0D0906      /* ほぼ黒 */
--gold: #C4A059    /* ゴールド（メインアクセント）*/
--t1: #E8DDD0      /* テキスト（暖色系白） */
--t2: #A89585      /* サブテキスト */
--t3: #6D5A4A      /* 薄いテキスト */
```
これは**世界観**。変えると「音楽系アーティストのツール」に見えなくなる。

### 2. スマホ縦1画面に収まる情報密度
- max-width: 480px（スマホ幅固定）
- 横スクロールなし
- フォントサイズは `.55rem`〜`.7rem` が基本（小さくていい。情報を詰める）

### 3. タップして離れる設計
- 1タップで記録できること
- 入力したら自動保存（blur or change で即 saveDB）
- 確認ダイアログは最小限

### 4. データは絶対に消えない設計
- `saveDB()` → `localStorage` に即保存
- `syncPush()` → GitHub Gist にクラウド同期（1.2秒デバウンス）
- `syncPull()` → 30秒ごと + タブ復帰時に自動pull
- Cookie にも保存（Safari での localStorage 揮発対策）

---

## データ構造（DB オブジェクト）

```javascript
DB = {
  ver: Number,          // 保存のたびにインクリメント
  updated: ISO8601,     // 最終更新時刻（mergeDBの新旧判定に使う）

  // KPI
  kpi: {
    subscribers: 5,       // YouTube登録者数
    total_plays: 1656,    // 総再生数
    short_plays: 0,       // Shorts再生数
    main_plays: 1232,     // メイン動画再生数
    songs: 10,            // リリース曲数
    revenue: 0,           // 収益（円）
  },

  // 目標値
  goals: {
    weeklyHours: 20,      // 週の制作時間目標
    yearSongs: 10,        // 年間リリース目標
    subTarget: 1000,      // 登録者目標
    playTarget: 50000,    // 再生数目標
    revenueTarget: 500000 // 収益目標
  },

  // 楽曲シリーズ（起承転結）
  songs: [
    { char: "起", title: "再起",  status: "released",    date: "2026-02-11" },
    { char: "承", title: "継承",  status: "released",    date: "2026-03-13" },
    { char: "転", title: "転機",  status: "in_progress", date: "2026-04-22" },
    { char: "結", title: null,    status: "planned",     date: null }
  ],

  // タスク
  tasks: [{
    id: Number(timestamp),
    text: String,
    cat: String,     // カテゴリ（下記参照）
    done: Boolean,
    due: String,     // "YYYY-MM-DD" or ""
    created: String, // "YYYY-MM-DD"
    doneDate: String,
    recurring: Boolean,
  }],

  // タイマーログ
  timerLog: [{ ts: Number, cat: String, min: Number, date: String }],
  timerTotal: Number,   // 累計分
  timerCat: String,     // 現在のカテゴリ
  timerStart: Number,   // タイマー開始timestamp

  // その他
  days: [String],       // 活動日一覧 ["YYYY-MM-DD", ...]
  mission: String,
  songStage: Number,
  kpiLog: [],
  weeklyLog: [],
  reflections: [],
  goodmot: [],
  swimLog: [],
  snsLog: [],
  assetPortfolio: [],
  assetHistory: [],
  commitments: [],

  // API設定（絶対に消さない）
  apiSettings: {
    gist: { id: String, token: String },
    yt:   { apiKey: String, channelId: String },
    nn:   { userId: String }
  }
}
```

---

## タスクカテゴリ

| cat | 意味 |
|-----|------|
| `🎵作曲` | 作曲・アレンジ |
| `🎤ボーカル` | ボイトレ・録音 |
| `mix` | MIX・マスタリング |
| `mv` | MV制作 |
| `release` | リリース作業 |
| `sns` | SNS投稿 |
| `🎓JBG` / `jbg` | ジャズベースギター（ボイトレ教室） |
| `learn` | 学習（AIPM等） |
| `invest` | 資産形成 |
| `🏃健康` | 健康・運動 |
| `life` | 生活全般 |

---

## 同期アーキテクチャ（最重要）

```
localStorage (draem_db)
    ↕ 常時
Cookie (draem_db バックアップ)
    ↕ 30秒ごと / タブ復帰時
GitHub Gist (draem.json)
```

### mergeDB のルール
- タスク: IDで突合。done=trueを優先
- timerLog: タイムスタンプで union
- KPI: 大きい方を採用
- mission/goals/songs: `updated` が新しい方を採用 ← **ここが先祖返りの原因になりやすい**

### 絶対に消してはいけない関数
```javascript
gc()                    // Gist設定を取得
ytConf()                // YouTube API設定を取得
nnConf()                // Niconico設定を取得
syncPull()              // Gistからpull
syncPush(immediate)     // Gistにpush
saveDB()                // localStorageに保存
mergeDB(remote)         // リモートとローカルをマージ
restoreApiFromDB()      // DB内のapiSettingsをlocalStorageに同期
overwriteData(file)     // 完全上書き復元（先祖返り対策）
```

---

## Service Worker

- `sw.js` の `V='v101'` がキャッシュバージョン
- **変更を入れたら必ずバージョンを上げる**（v101 → v102 など）
- HTML は network-first（常に最新を取得）
- JS/CSS/画像はキャッシュ優先

---

## やってはいけないこと（過去の失敗実例）

| やったこと | 結果 |
|---|---|
| `_sc_call_ai()` から `model_name` 引数を削除 | AI比較機能が壊れた |
| `from provider_status import ...` を削除 | 使用量表示が壊れた |
| `mergeDB` の `updated` 比較を外した | 毎回古いデータで上書き |
| SW バージョンを上げなかった | ブラウザが古いキャッシュを使い続けた |
| Gist設定を保存する前にページを閉じた | 設定が消えてlocalStorageのみになった |

---

## Codexへの作業依頼の形式

新機能を追加する場合：
1. **既存の `// ──〇〇──` セクション構造に倣う**
2. **DB に新フィールドを追加する場合は `loadDB()` のデフォルト値も追加**
3. **UIに触れる場合はデザイン原則（黒背景・ゴールド・スマホ幅）を守る**
4. **SW バージョンを +1 する**
5. **`saveDB()` と `syncPush()` を必ず呼ぶ**（保存漏れを防ぐ）

---

## リポジトリ構成

```
draem-dash/
  index.html          ← すべてここ（2500行超の単一ファイル）
  sw.js               ← Service Worker
  manifest.json       ← PWA設定
  data/
    niconico.json     ← GitHub Actionsで自動更新
  .github/workflows/  ← CI/CD（Pages自動デプロイ + niconico更新）
```

---

## URL

本番: `https://ryu625.github.io/draem-dash/`
