# Spotory

写真とGoogle Maps情報を紐づけて、訪問した場所を記録・共有するモバイルファーストPWAです。GitHub Pagesに静的フロントエンドを公開し、認証・DB・非公開写真はSupabaseで管理します。

## 実装済み機能

- Magic Link / Google OAuth、セッション監視、保護ルート
- 場所・訪問記録の登録、編集、削除、下書き保存
- 評価、コメント、カテゴリー、タグ、お気に入り、行きたい、公開範囲
- ブラウザでの画像検証・長辺1600px/約78% WebP圧縮、複数選択、プレビュー、Storage保存
- Google Maps表示、マーカー、外部地図・経路URL（キー未設定時は安全に手入力へフォールバック）
- グループの作成・一覧とowner/editor/viewerを保証するRLS
- JSON/UTF-8 BOM付きCSVエクスポート
- PWA、オフラインキャッシュ、更新通知、iPhone Safe Area、ダークモード
- GitHub Actionsによるlint/typecheck/test/build/Pagesデプロイ

招待トークンと共有リンクのテーブル・RLS境界は実装済みです。トークンを安全に発行・利用するEdge Functionと、写真ZIP/Google Drive自動転送は次期実装です。

## ローカル開発

Node.js 22 LTSを推奨します。

```bash
npm install
cp .env.example .env
npm run dev
```

`.env`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
VITE_GOOGLE_MAPS_API_KEY=YOUR_BROWSER_KEY
VITE_APP_NAME=Spotory
VITE_BASE_PATH=/
VITE_USE_MOCK_DATA=false
```

SupabaseなしでUIを確認するときだけ、ローカルの `VITE_USE_MOCK_DATA=true` を使えます。本番ビルドはモックを自動使用しません。`service_role` キーは絶対にフロントエンドへ設定しないでください。

## Supabase設定

1. Supabaseでプロジェクトを作成します。
2. SQL EditorまたはCLIで `supabase/migrations/202607210001_initial.sql` を適用します。テーブル、制約、RLS、非公開Storage bucketが作成されます。
3. Authentication > URL ConfigurationでSite URLをGitHub Pages URLにし、`https://<user>.github.io/<repo>/` をRedirect URLsへ追加します。ローカルは `http://localhost:5173/` も追加します。
4. Authentication > ProvidersでEmailを有効化します。Google利用時はGoogleのClient ID/SecretをSupabaseへ設定します。
5. Storageの `visit-photos` と `avatars` はmigrationが非公開で作成します。写真パスは `user-id/visit-id/photo-id.webp`、アバターは `user-id/avatar.webp` です。

RLSは訪問者本人、共有グループのメンバー、owner/editor権限をDB側で判定します。UUIDを知っているだけでは取得できません。写真のStorage Policyも関連visitの権限を参照します。

## Google Cloud設定

Google Maps Platformで Maps JavaScript API と Places API (New) を有効化し、ブラウザキーを作成します。Application restrictionsをHTTP referrersにし、ローカルと `https://<user>.github.io/<repo>/*` のみ許可します。API restrictionsは上記2 APIだけに限定してください。検索は今後のPlaces候補UIでデバウンスとセッショントークンを使う前提です。キー未設定でもアプリ全体は動作し、場所を手入力できます。

## GitHub Pages

1. GitHubのSettings > Pages > Sourceを **GitHub Actions** にします。
2. Actions secretsに `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`VITE_GOOGLE_MAPS_API_KEY` を登録します。
3. `main` へpushすると `.github/workflows/deploy.yml` が品質チェック後に公開します。ベースパスはリポジトリ名から自動設定されます。

公開リポジトリへ `.env`、写真、ユーザーデータをコミットしないでください。Supabaseの公開用anon/publishableキーはRLS前提ですが、環境ごとの設定管理のためSecretsから注入します。Googleキーはリファラー/API制限が必須です。

## PWAとバックアップ

iPhoneではSafariの共有ボタンから「ホーム画面に追加」を選びます。写真はアップロード前にWebP圧縮し、通信量と無料枠消費を抑えます。設定画面からJSONまたはExcelで文字化けしにくいCSVをダウンロードし、手動でGoogle Driveへ保存できます。写真ZIPは未実装です。

## 品質チェック

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

このリポジトリは `pnpm-lock.yaml` も含み、CIでは再現性のため `pnpm install --frozen-lockfile` を使用します。ローカルではnpmでもpnpmでも利用できます。

トラブル時は、GitHub Pagesのベースパス、Supabase Redirect URL、RLS migrationの適用、Googleキーのリファラー制限を順に確認してください。Magic Linkが別ブラウザで開かれるiPhoneでは、ホーム画面PWAとSafariのセッションが別になる場合があります。
