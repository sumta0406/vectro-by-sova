# 案件管理ツール

作家・ミュージシャンの案件をガントチャートで管理するWebサービス。
管理者（sumta）と作家3名が使用。将来的にミュージシャンのライブ・練習・宣伝管理にも拡張予定。

## スタック

- **フロントエンド**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **バックエンド**: Server Actions
- **DB・認証**: Supabase (PostgreSQL + Auth)
- **デプロイ**: Vercel

## ディレクトリ構成

```
src/
├── app/
│   ├── page.tsx              # メイン画面（ガントチャート + 案件一覧）
│   ├── login/page.tsx        # ログイン（マジックリンク）
│   ├── auth/callback/        # Supabase認証コールバック
│   └── actions/projects.ts   # Server Actions（CRUD + 履歴記録）
├── components/
│   ├── GanttChart.tsx        # ガントチャート（月表示）
│   ├── ProjectList.tsx       # 案件一覧（親子2階層）
│   ├── ProjectForm.tsx       # 案件追加・編集モーダル
│   └── ProjectHistoryPanel.tsx # 編集履歴モーダル
├── lib/supabase/
│   ├── client.ts             # ブラウザ用クライアント
│   └── server.ts             # サーバー用クライアント
├── middleware.ts              # 未ログインを/loginにリダイレクト
└── types/index.ts            # 型定義
supabase/migrations/001_init.sql  # DBスキーマ
```

## DBスキーマ

- **profiles**: ユーザー情報（name, role: admin/member）
- **projects**: 案件（parent_idで親子2階層、RLSで権限制御）
- **milestones**: 案件内の日付イベント（打ち合わせ・初稿・歌詞・データ・納品）
- **project_history**: 編集履歴（誰がいつ何を変えたか）

## 権限

- **admin**: 全作家の案件を読み書き可
- **member**: 自分の案件のみ読み書き可（RLSで強制）

## コマンド

```bash
pnpm dev        # 開発サーバー
pnpm build      # ビルド
vercel          # デプロイ
```

## 初回セットアップ手順

1. Supabaseで新プロジェクト作成
2. `supabase/migrations/001_init.sql` をSupabaseのSQL Editorで実行
3. `.env.local.example` → `.env.local` にコピーして値を入れる
4. Supabaseダッシュボード → Authentication → URL Configuration で
   `Site URL` と `Redirect URLs` に本番URL・localhost:3000 を設定
5. `pnpm dev` で確認
6. GitHubにpush → Vercelでデプロイ
7. Vercelに環境変数（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）を設定
8. Supabaseで自分のアカウントのroleをadminに変更:
   `UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id';`

## コーディングルール

- Server Componentをデフォルト。`"use client"` は必要な時だけ
- DBアクセスはServer Actionsかpage.tsx（Server Component）で行う
- 型は `src/types/index.ts` を使う
- `any` 禁止
