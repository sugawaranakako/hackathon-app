# 📋 レシピアプリ - プロジェクト設計書

## 📖 プロジェクト概要

### アプリケーション名
**🍳 レシピアプリ (Recipe App)**

### 目的・コンセプト
スマートフォンでの利用を前提とした、直感的で使いやすいレシピ管理アプリケーション。iPhoneライクなモダンUIで、料理初心者から上級者まで快適に利用できるレシピ閲覧・管理システム。

### ターゲットユーザー
- **主要ターゲット**: 20-40代の料理を作る人
- **サブターゲット**: 料理初心者、レシピを整理したい人
- **利用シーン**: 買い物中、料理中、レシピ検索時

## 🎯 機能要件

### Core機能（必須機能）

#### 1. レシピ表示機能
- **レシピ一覧表示**
  - グリッドレイアウトでカード形式表示
  - 料理画像、名前、説明、調理時間、難易度を表示
  - スクロールでの閲覧

- **レシピ詳細表示**
  - 全画面表示での詳細情報
  - 材料リスト（チェックボックス付き）
  - 手順の番号付きリスト表示
  - 調理時間・難易度の表示

#### 2. 検索・フィルタリング機能
- **検索機能**
  - レシピ名での検索
  - 材料・説明文での部分一致検索
  - リアルタイム検索結果表示

#### 3. お気に入り機能
- **ブックマーク機能**
  - ハートボタンでの登録/解除
  - お気に入り一覧画面
  - 状態の永続化

#### 4. 材料管理機能
- **チェックボックス機能**
  - 各材料にチェック可能
  - チェック状態の視覚的フィードバック（取り消し線）
  - 進捗表示（完了数/総数）
  - 全選択/全解除ボタン
  - localStorage による状態保持

### Enhanced機能（将来拡張）

#### 1. 料理支援機能
- [ ] タイマー機能（各手順ごと）
- [ ] 分量計算機（人数調整）
- [ ] 栄養成分表示

#### 2. ソーシャル機能
- [ ] レシピ評価・レビュー
- [ ] レシピシェア機能
- [ ] ユーザー投稿レシピ

#### 3. 実用機能
- [ ] ショッピングリスト生成
- [ ] レシピ履歴
- [ ] オフライン対応（PWA化）

## 🏗️ アーキテクチャ設計

### 技術スタック

#### フロントエンド
- **React** 18+ (Function Components + Hooks)
- **CSS3** (カスタムスタイリング)
- **localStorage** (ローカルデータ永続化)

#### 外部リソース
- **Unsplash API** (料理画像)

### コンポーネント構成

```
App (Root Component)
├── Header (AppHeader)
├── Main Content
│   ├── Home (RecipeGrid)
│   ├── Search (SearchView)
│   └── Bookmarks (BookmarkView)
├── Recipe Detail (FullScreen)
│   ├── RecipeHero (Image + Basic Info)
│   ├── IngredientsSection (with Checkboxes)
│   └── InstructionsSection
└── BottomNavigation
```

### 状態管理

#### ローカル状態 (useState)
```javascript
// App.js内の状態
const [selectedRecipe, setSelectedRecipe] = useState(null);
const [activeTab, setActiveTab] = useState('home');
const [bookmarks, setBookmarks] = useState([]);
const [searchQuery, setSearchQuery] = useState('');
const [checkedIngredients, setCheckedIngredients] = useState({});
```

#### 永続化データ (localStorage)
- `checkedIngredients`: 材料チェック状態
- 将来的に追加予定:
  - `bookmarks`: お気に入りレシピID配列
  - `userPreferences`: ユーザー設定

## 🎨 UI/UX設計

### デザインシステム

#### カラーパレット
```css
Primary Colors:
- Main: #FF6B6B (Orange Red)
- Secondary: #FF8E53 (Orange)
- Success: #4CAF50 (Green)

Neutral Colors:
- Background: #f5f5f5 (Light Gray)
- Surface: #ffffff (White)
- Text Primary: #333333 (Dark Gray)
- Text Secondary: #666666 (Medium Gray)
```

#### タイポグラフィ
- **Font Family**: -apple-system, BlinkMacSystemFont, 'Segoe UI'
- **Sizes**: 
  - H1: 1.8rem (Hero Titles)
  - H2: 1.5rem (Section Titles)
  - H3: 1.3rem (Card Titles)
  - Body: 0.95rem (Regular Text)
  - Small: 0.8-0.85rem (Meta Info)

#### スペーシング
- **基本単位**: 4px
- **要素間**: 8px, 12px, 16px, 20px, 24px
- **セクション間**: 32px

### レスポンシブデザイン

#### Breakpoints
```css
Mobile First Approach:
- Mobile: ~414px (iPhone 12 Pro size)
- Desktop: 415px+ (Desktop preview with mobile frame)
```

#### レイアウト原則
1. **Mobile First**: スマートフォンでの使用を最優先
2. **Thumb-Friendly**: 親指で操作しやすいタップターゲット
3. **Visual Hierarchy**: 明確な情報階層
4. **Consistent Spacing**: 統一されたマージン・パディング

## 📱 インタラクション設計

### ナビゲーション
- **Bottom Tab Navigation**: 3つの主要機能へのアクセス
  - 🏠 Home: レシピ一覧
  - 🔍 Search: 検索機能
  - ❤️ Bookmarks: お気に入り

### アニメーション
```css
Standard Transitions:
- Duration: 0.3s
- Easing: ease
- Properties: transform, opacity, background-color
```

#### 具体的なアニメーション
1. **Card Hover**: `translateY(-2px)` + shadow enhancement
2. **Button Press**: `scale(0.98)` (active state)
3. **Page Transition**: `slideInUp` for recipe detail
4. **Checkbox**: `scale(1.1)` on check

### フィードバック
- **Visual Feedback**: ホバー状態、押下状態の視覚変化
- **Progress Indication**: チェック完了数の表示
- **State Changes**: 滑らかなトランジション

## 📊 データ設計

### レシピデータ構造
```javascript
interface Recipe {
  id: number;
  name: string;
  image: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  difficulty: '簡単' | '普通' | '難しい';
}
```

### ローカルストレージ構造
```javascript
// checkedIngredients in localStorage
{
  "1-0": true,  // recipeId-ingredientIndex: boolean
  "1-2": true,
  "2-1": false,
  ...
}
```

## 🔧 開発・デプロイ

### 開発環境
- **Node.js**: 16+
- **npm**: Package manager
- **Create React App**: Build tool
- **VSCode**: 推奨エディタ

### ファイル構成
```
recipe-app/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── favicon.ico
├── src/
│   ├── components/        # 将来のコンポーネント分割用
│   ├── data/
│   │   └── recipes.js     # レシピマスターデータ
│   ├── App.js            # メインアプリケーション
│   ├── App.css           # スタイルシート
│   └── index.js          # エントリーポイント
├── README.md
├── PROJECT.md
└── package.json
```

### 開発コマンド
```bash
npm start       # 開発サーバー起動
npm run build   # プロダクションビルド
npm test        # テスト実行
npm run eject   # Create React App設定の展開
```

## 🚀 今後の開発計画

### フェーズ1 (現在) - 基本機能
- ✅ レシピ表示機能
- ✅ 検索機能
- ✅ お気に入り機能
- ✅ 材料チェック機能

### フェーズ2 - 機能拡張
- [ ] タイマー機能
- [ ] 分量計算機
- [ ] 栄養成分表示
- [ ] レシピ評価機能

### フェーズ3 - パフォーマンス・UX向上
- [ ] PWA対応（オフライン機能）
- [ ] パフォーマンス最適化
- [ ] アクセシビリティ改善
- [ ] 多言語対応

### フェーズ4 - ソーシャル機能
- [ ] ユーザー投稿機能
- [ ] レシピシェア機能
- [ ] コミュニティ機能

## 📈 成功指標

### 技術指標
- [ ] Lighthouse スコア 90+
- [ ] モバイルフレンドリネス合格
- [ ] アクセシビリティスコア AA準拠

### ユーザビリティ指標
- [ ] レシピ詳細までの平均タップ数: 2回以下
- [ ] 検索から結果表示まで: 1秒以内
- [ ] チェックボックス操作レスポンス: 即座

## 🐛 テスト計画

### 機能テスト
- [ ] レシピ表示・詳細画面遷移
- [ ] 検索機能の動作確認
- [ ] お気に入り登録・解除
- [ ] 材料チェック機能・永続化

### デバイステスト
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] デスクトップブラウザ

### パフォーマンステスト
- [ ] 画像読み込み速度
- [ ] レスポンシブ動作確認
- [ ] メモリ使用量チェック

---

**更新日**: 2025年7月30日  
**バージョン**: 1.1.0  
**ステータス**: 開発中