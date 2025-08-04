# レシピアプリ Claude API統合

このアプリケーションは、Vertex AI経由でClaude APIを使用してAI機能を追加したレシピアプリです。

## 🚀 新機能

### 1. 賢い食材使い切り機能
- 材料リストで「使い切りたい食材」をトグル選択
- 例：「玉ねぎ1/2個→1個に増やしたい」
- Claude AIが味のバランスを保つ調整案を提案
- 他の調味料や材料の分量も自動調整

### 2. 料理相談チャット機能
- 右下のフローティングチャットボタンから利用
- 「片栗粉がないけどどうしたら？」などの相談に回答
- 現在見ているレシピに関連した文脈を理解
- 代替食材、調理法、コツなどを相談可能

## 🛠️ セットアップ

### 前提条件
- Node.js 16以上
- Google Cloud Project
- Vertex AI APIが有効
- Claude API（Vertex AI経由）へのアクセス権

### 1. 依存関係インストール
```bash
npm install
```

### 2. 環境変数設定
`.env`ファイルを作成し、以下を設定：

```env
# Google Cloud設定
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# サーバー設定
PORT=3001
NODE_ENV=development

# 認証設定（いずれかの方法）
# 方法1: サービスアカウントキー
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json

# 方法2: gcloud認証（開発環境推奨）
# gcloud auth application-default login
```

### 3. Google Cloud認証設定

#### 方法A: サービスアカウント（推奨）
1. Google Cloud Consoleでサービスアカウントを作成
2. Vertex AI User権限を付与
3. JSONキーファイルをダウンロード
4. 環境変数`GOOGLE_APPLICATION_CREDENTIALS`でパスを指定

#### 方法B: gcloud CLI（開発環境）
```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

### 4. 起動

#### 開発環境（フロントエンド + バックエンド同時起動）
```bash
npm run dev
```

#### 個別起動
```bash
# バックエンドのみ
npm run server

# フロントエンドのみ（別ターミナル）
npm start
```

## 🔧 API エンドポイント

### POST /api/optimize-ingredients
食材使い切り最適化

```json
{
  "recipe": {
    "name": "レシピ名",
    "ingredients": ["材料リスト"]
  },
  "ingredientsToOptimize": [
    {
      "ingredient": "玉ねぎ",
      "currentAmount": "1/2個",
      "desiredAmount": "1個"
    }
  ]
}
```

### POST /api/cooking-chat
料理相談チャット

```json
{
  "message": "片栗粉がないけどどうしたら？",
  "currentRecipe": {
    "name": "レシピ名",
    "ingredients": ["材料リスト"]
  },
  "chatHistory": [
    {"role": "user", "content": "前の質問"},
    {"role": "assistant", "content": "前の回答"}
  ]
}
```

### POST /api/suggest-improvements
レシピ改善提案

```json
{
  "recipe": {
    "name": "レシピ名",
    "ingredients": ["材料リスト"],
    "instructions": ["手順リスト"]
  },
  "userPreferences": {
    "healthFocus": "low-salt",
    "timeConstraint": "quick"
  }
}
```

## 🎯 使用方法

### 賢い食材使い切り機能
1. レシピ詳細画面を開く
2. 材料リストの下にある「賢い食材使い切り」セクションで使い切りたい食材をチェック
3. 希望量を入力（例：1個、200g など）
4. 「AI最適化実行」ボタンをクリック
5. Claude AIからの調整提案を確認
6. 「この調整を適用」で材料リストが更新

### 料理相談チャット
1. 右下の「料理相談」ボタンをクリック
2. 現在見ているレシピがある場合、そのコンテキストで回答
3. 自由に質問を入力して送信
4. 定型質問ボタンでよくある質問も利用可能

## 🏗️ プロジェクト構成

```
src/
├── services/
│   └── api.js              # APIサービス関数
├── components/
│   ├── IngredientOptimizer.js  # 食材使い切り機能
│   ├── IngredientOptimizer.css
│   ├── CookingChat.js          # 料理相談チャット
│   └── CookingChat.css
└── App.js                  # メインアプリ（AI機能統合済み）

server.js                   # Node.js APIサーバー
```

## 🔒 セキュリティ

- APIキーはサーバーサイドでのみ使用
- クライアントサイドにはAPIキーを露出しない
- Vertex AI経由でClaude APIを安全に利用
- CORS設定によりフロントエンドからのアクセスを制限

## 🐛 トラブルシューティング

### よくある問題

#### 認証エラー
```
Error: Could not load the default credentials
```
→ Google Cloud認証を確認してください

#### API呼び出しエラー
```
Error: 403 Forbidden
```
→ プロジェクトでVertex AI APIが有効になっているか確認

#### ネットワークエラー
```
CORS policy error
```
→ バックエンドサーバーが起動しているか確認（localhost:3001）

### デバッグ

サーバーログを確認：
```bash
npm run dev:server  # nodemonでホットリロード
```

API疎通確認：
```bash
curl http://localhost:3001/api/health
```

## 📊 パフォーマンス

- Claude API呼び出しは非同期で実行
- ローディング状態を適切に表示
- エラーハンドリングでユーザー体験を向上
- レスポンス時間：通常2-5秒

## 🎨 UI/UX特徴

- 食材使い切り機能は直感的なトグル操作
- チャット機能は最小化/展開可能
- モバイル対応のレスポンシブデザイン
- アニメーションでスムーズな体験

## 📝 開発メモ

- Claude APIは300文字以内で簡潔な回答を返すよう設定
- 翻訳機能との連携でグローバルレシピにも対応
- 栄養価計算との組み合わせで健康的な調整提案
- チャット履歴は現在セッション内のみ保持