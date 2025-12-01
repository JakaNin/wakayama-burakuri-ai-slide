# ぶらくり会 AI Q&A システム

イベント参加者からの質問・コメントを収集し、AIで要約・分類するシステム

## 機能

- 📝 **質問投稿** - 参加者が匿名で質問/コメントを投稿
- 📊 **リアルタイム表示** - 管理者画面で質問一覧を5秒ごとに自動更新
- 🤖 **AI分析** - Claude APIで質問を要約・カテゴリ分類
- 💾 **永続化** - Vercel KVでデータを確実に保存・共有

## 画面

| URL | 用途 |
|-----|------|
| `/` | 参加者用：質問投稿フォーム |
| `/admin` | 管理者用：質問一覧 + AI分析 |

## セットアップ

### 1. Vercelにデプロイ

```bash
# Vercel CLIでデプロイ
npx vercel
```

### 2. Vercel KVを追加

1. Vercelダッシュボード → プロジェクト → Storage
2. 「Create Database」→「KV」を選択
3. 環境変数が自動設定される

### 3. Anthropic API Keyを設定

1. Vercelダッシュボード → Settings → Environment Variables
2. `ANTHROPIC_API_KEY` を追加

### 4. 再デプロイ

```bash
npx vercel --prod
```

## ローカル開発

```bash
# 環境変数設定
cp .env.example .env.local
# .env.local に各キーを設定

# 開発サーバー起動
npm run dev
```

## 技術スタック

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Vercel KV (Redis)
- Claude API (Anthropic)
