# 🎴 パック・バトラーズ

パックを引いてカードを集め、20枚のデッキで戦うカードバトル。ソロ（AI 3段階）とオンライン対戦（ランダムマッチ／ルームコード）に対応。

- フロント: `public/`（依存なしの HTML/CSS/JS。コレクションはブラウザの localStorage に保存）
- サーバー: `src/worker.js`（Cloudflare Workers + Durable Objects。対戦ルームごとに1つの Durable Object が WebSocket でゲームを進行）
- ルール/AI: `public/engine.js` `public/ai.js`（サーバーとブラウザで共通）

## ローカルで動かす

```bash
cd card-battle
npm install
npm run dev      # http://localhost:8787
npm test         # AI同士で2000戦してエンジンを検証
```

## Cloudflare にデプロイ

どちらか1つでOK（Durable Objects は無料プランで使えます）。

**A. Cloudflare ダッシュボードから（おすすめ・トークン不要）**
1. Workers & Pages → 作成 → 「リポジトリをインポート」→ このリポジトリを選択
2. ルートディレクトリ: `card-battle`、デプロイコマンド: `npx wrangler deploy`
3. 以後 main への push で自動デプロイ。URL は `https://card-battle.<サブドメイン>.workers.dev`

**B. GitHub Actions から**
リポジトリの Settings → Secrets に `CLOUDFLARE_API_TOKEN`（「Workers を編集」テンプレート）と `CLOUDFLARE_ACCOUNT_ID` を登録すると、`.github/workflows/cloudflare.yml` が main への push でデプロイします。

**C. 手元から** `npx wrangler login && npm run deploy`

GitHub Pages 版（`/card-battle/public/`）でもソロ対戦・パック・デッキ編集は遊べます（オンライン対戦は Cloudflare 版のみ）。
