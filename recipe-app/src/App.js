import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { recipesData } from './data/recipes';
import LazyImage from './components/LazyImage';
import IngredientOptimizer from './components/IngredientOptimizer';

// Claude APIベースの翻訳システム
const createTranslationSystem = () => {
  const DEBUG_MODE = true;
  
  // Claude API翻訳関数
  const translateWithClaude = async (title, ingredients, instructions) => {
    try {
      console.log('🤖 Calling Claude API for translation...');
      
      const response = await fetch('http://localhost:3001/api/translate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          ingredients: ingredients,
          instructions: instructions
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Claude translation successful');
        return result.data;
      } else {
        throw new Error('Translation failed or returned invalid data');
      }
    } catch (error) {
      console.warn('⚠️ Claude translation failed:', error.message);
      // フォールバック: 元のデータを返す
      return {
        title: title,
        ingredients: ingredients || [],
        instructions: instructions || []
      };
    }
  };
  
  // シンプルな翻訳関数（フォールバック用）
  const translate = (text, type = 'general') => {
    if (!text || typeof text !== 'string') return text;
    return text; // Claude APIに依存するため、ここでは元のテキストを返す
  };
  
  const checkUntranslated = (text) => {
    return []; // Claude APIベースなので、未翻訳チェックは不要
  };
  
  return {
    translate,
    translateWithClaude,
    checkUntranslated,
    DEBUG_MODE
  };
};

// 翻訳システムのインスタンス作成
const translationSystem = createTranslationSystem();

// Claude APIベースの翻訳関数
const translateRecipeWithClaude = async (recipe) => {
  try {
    console.log('🌍 Translating recipe with Claude API:', recipe.strMeal || recipe.name);
    
    // キャッシュキーを生成（レシピIDベース）
    const cacheKey = `recipe_${recipe.idMeal || recipe.id}_translated`;
    
    // キャッシュをチェック（localStorage使用）
    const cachedTranslation = localStorage.getItem(cacheKey);
    if (cachedTranslation) {
      console.log('✅ Using cached translation for:', recipe.strMeal || recipe.name);
      return JSON.parse(cachedTranslation);
    }
    
    // TheMealDBデータから材料と手順を抽出
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`];
      const measure = recipe[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        const fullIngredient = measure ? `${ingredient} ${measure}`.trim() : ingredient;
        ingredients.push(fullIngredient);
      }
    }
    
    const instructions = [];
    if (recipe.strInstructions) {
      const instructionSteps = recipe.strInstructions
        .split(/\r?\n/)
        .filter(step => step.trim() && step.length > 10)
        .map(step => step.trim());
      instructions.push(...instructionSteps);
    }
    
    // Claude API翻訳を呼び出す
    const translated = await translationSystem.translateWithClaude(
      recipe.strMeal,
      ingredients,
      instructions
    );
    
    // 翻訳結果をキャッシュに保存
    localStorage.setItem(cacheKey, JSON.stringify(translated));
    
    return {
      name: translated.title || recipe.strMeal,
      ingredients: translated.ingredients || ingredients,
      instructions: translated.instructions || instructions,
      translatedWithClaude: true
    };
  } catch (error) {
    console.warn('⚠️ Recipe translation failed:', error.message);
    
    // フォールバック: 元のデータを返す
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`];
      const measure = recipe[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        const fullIngredient = measure ? `${ingredient} ${measure}`.trim() : ingredient;
        ingredients.push(fullIngredient);
      }
    }
    
    const instructions = [];
    if (recipe.strInstructions) {
      const instructionSteps = recipe.strInstructions
        .split(/\r?\n/)
        .filter(step => step.trim() && step.length > 10)
        .map(step => step.trim());
      instructions.push(...instructionSteps);
    }
    
    return {
      name: recipe.strMeal,
      ingredients: ingredients,
      instructions: instructions,
      translatedWithClaude: false
    };
  }
};

function App() {
  const [openRecipes, setOpenRecipes] = useState([]);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [bookmarks, setBookmarks] = useState([]);
  const [memos, setMemos] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [notification, setNotification] = useState(null);
  const [worldRecipes, setWorldRecipes] = useState([]);
  const [isLoadingWorldRecipes, setIsLoadingWorldRecipes] = useState(false);
  const [worldRecipesError, setWorldRecipesError] = useState(null);
  const [hasLoadedInitialRecipes, setHasLoadedInitialRecipes] = useState(false);
  const [displayedWorldRecipesCount, setDisplayedWorldRecipesCount] = useState(5);
  const [ingredientCount, setIngredientCount] = useState(0);
  const [usageStats, setUsageStats] = useState({
    totalRecipesViewed: 0,
    favoriteRecipes: 0,
    totalCookingTime: 0
  });

  const bookmarkedRecipes = useMemo(() => {
    const allRecipes = [...recipesData, ...worldRecipes];
    return allRecipes.filter(recipe => bookmarks.includes(recipe.id));
  }, [bookmarks, worldRecipes]);

  const filteredRecipes = useMemo(() => {
    if (!searchQuery) return recipesData;
    
    return recipesData.filter(recipe =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.ingredients.some(ingredient => 
        ingredient.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery]);

  // ローカルストレージからデータを読み込み
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('recipeBookmarks');
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }

    const savedMemos = localStorage.getItem('recipeMemos');
    if (savedMemos) {
      setMemos(JSON.parse(savedMemos));
    }

    const savedStats = localStorage.getItem('usageStats');
    if (savedStats) {
      setUsageStats(JSON.parse(savedStats));
    }
  }, []);

  // PWAインストールプロンプト処理
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      const result = await deferredPrompt.prompt();
      if (result.outcome === 'accepted') {
        setNotification('アプリがインストールされました！');
      }
    } catch (error) {
      setNotification('インストール中にエラーが発生しました');
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('recipeMemos', JSON.stringify(memos));
  }, [memos]);
  
  // 初回マウント時に世界のレシピを遅延取得（初期表示高速化のため）
  useEffect(() => {
    const loadInitialWorldRecipes = async () => {
      if (hasLoadedInitialRecipes) return;
      
      // 2秒後に世界のレシピを取得（初期表示を高速化）
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsLoadingWorldRecipes(true);
      setWorldRecipesError(null);
      
      try {
        const searchTerms = ['chicken', 'beef', 'pasta', 'fish', 'soup'];
        const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${randomTerm}`);
        if (!response.ok) throw new Error('ネットワークエラー');
        
        const data = await response.json();
        if (data.meals && data.meals.length > 0) {
          // Claude APIで翻訳
          const translationPromises = data.meals.slice(0, 5).map(async (meal) => {
            const translated = await translateRecipeWithClaude(meal);
            
            // コツと副菜を自動生成
            const { tips, sideDishes } = generateTipsAndSideDishes(meal.strMeal, meal.strArea);
            
            return {
              id: `world-${meal.idMeal}`,
              name: translated.name,
              description: `世界の料理 - ${meal.strCategory}`,
              image: meal.strMealThumb,
              cookingTime: '30分',
              difficulty: '普通',
              servings: 2,
              ingredients: translated.ingredients,
              instructions: translated.instructions,
              tips: tips,
              sideDishes: sideDishes,
              isWorldRecipe: true,
              originalMeal: meal,
              translatedWithClaude: translated.translatedWithClaude
            };
          });
          
          const translatedRecipes = await Promise.all(translationPromises);
          setWorldRecipes(translatedRecipes);
        }
        
        setHasLoadedInitialRecipes(true);
      } catch (error) {
        console.log('初回世界レシピ読み込みエラー:', error);
        setHasLoadedInitialRecipes(true);
      } finally {
        setIsLoadingWorldRecipes(false);
      }
    };

    loadInitialWorldRecipes();
  }, []);

  // コツと副菜を自動生成する関数
  const generateTipsAndSideDishes = (name, region) => {
    const lowerName = name.toLowerCase();
    const lowerRegion = region ? region.toLowerCase() : '';
    
    // 料理名に基づくコツ
    let tips = [];
    if (lowerName.includes('pasta') || lowerName.includes('spaghetti')) {
      tips = [
        "パスタは塩を多めに入れたお湯で茹でましょう",
        "アルデンテに仕上げるのがポイントです",
        "茹で汁を少し残してソースと絡めると美味しくなります"
      ];
    } else if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('pork')) {
      tips = [
        "肉は常温に戻してから調理すると均一に火が通ります",
        "強火で表面を焼いて旨味を閉じ込めましょう",
        "休ませる時間も大切です"
      ];
    } else if (lowerName.includes('soup') || lowerName.includes('broth')) {
      tips = [
        "野菜の旨味を引き出すためにじっくり煮込みましょう",
        "塩加減は最後に調整するのがポイント",
        "香草を加えると風味がアップします"
      ];
    } else {
      tips = [
        "材料の下準備をしっかりすることが美味しさの秘訣",
        "火加減に注意して焦がさないように調理しましょう",
        "味見をしながら調味料を調整してください"
      ];
    }
    
    // 地域別の副菜
    let sideDishes = [];
    if (lowerRegion.includes('italian') || lowerName.includes('pasta')) {
      sideDishes = ["シーザーサラダ", "ガーリックブレッド", "ミネストローネ"];
    } else if (lowerRegion.includes('indian') || lowerName.includes('curry')) {
      sideDishes = ["バスマティライス", "ナン", "ヨーグルトサラダ"];
    } else if (lowerRegion.includes('chinese') || lowerRegion.includes('thai')) {
      sideDishes = ["白いご飯", "春雨サラダ", "わかめスープ"];
    } else if (lowerRegion.includes('mexican')) {
      sideDishes = ["トルティーヤ", "アボカドサラダ", "ライムライス"];
    } else {
      sideDishes = ["パン", "グリーンサラダ", "スープ"];
    }
    
    return { tips, sideDishes };
  };

  const loadMoreWorldRecipes = useCallback(async () => {
    if (isLoadingWorldRecipes) return;
    
    setIsLoadingWorldRecipes(true);
    
    try {
      const searchTerms = ['chicken', 'beef', 'pasta', 'curry', 'salad', 'fish', 'soup', 'rice', 'potato', 'egg'];
      const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
      
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${randomTerm}`);
      if (!response.ok) throw new Error('ネットワークエラー');
      
      const data = await response.json();
      if (data.meals && data.meals.length > 0) {
        // Claude APIで翻訳
        const translationPromises = data.meals.slice(0, 6).map(async (meal) => {
          const translated = await translateRecipeWithClaude(meal);
          
          // コツと副菜を自動生成
          const { tips, sideDishes } = generateTipsAndSideDishes(meal.strMeal, meal.strArea);
          
          return {
            id: `world-${meal.idMeal}-${Date.now()}-${Math.random()}`, // 重複防止
            name: translated.name,
            description: `世界の料理 - ${meal.strCategory}`,
            image: meal.strMealThumb,
            cookingTime: '30分',
            difficulty: '普通',
            servings: 2,
            ingredients: translated.ingredients,
            instructions: translated.instructions,
            tips: tips,
            sideDishes: sideDishes,
            isWorldRecipe: true,
            originalMeal: meal,
            translatedWithClaude: translated.translatedWithClaude
          };
        });
        
        const translatedRecipes = await Promise.all(translationPromises);
        setWorldRecipes(prev => [...prev, ...translatedRecipes]);
        setDisplayedWorldRecipesCount(prev => prev + 6);
      }
    } catch (error) {
      console.log('追加世界レシピ読み込みエラー:', error);
    } finally {
      setIsLoadingWorldRecipes(false);
    }
  }, [isLoadingWorldRecipes]);


  const openRecipe = useCallback((recipe) => {
    const existingIndex = openRecipes.findIndex(r => r.id === recipe.id);
    if (existingIndex !== -1) {
      setActiveRecipeIndex(existingIndex);
    } else {
      setOpenRecipes(prev => [...prev, recipe]);
      setActiveRecipeIndex(openRecipes.length);
    }
    setActiveTab('recipe');
    
    // 使用統計を更新
    setUsageStats(prev => ({
      ...prev,
      totalRecipesViewed: prev.totalRecipesViewed + 1
    }));
  }, [openRecipes]);

  const closeRecipe = useCallback((index) => {
    const newOpenRecipes = openRecipes.filter((_, i) => i !== index);
    setOpenRecipes(newOpenRecipes);
    
    if (newOpenRecipes.length === 0) {
      setActiveTab('home');
    } else if (activeRecipeIndex >= newOpenRecipes.length) {
      setActiveRecipeIndex(newOpenRecipes.length - 1);
    }
  }, [openRecipes, activeRecipeIndex]);

  const toggleBookmark = useCallback((recipeId) => {
    setBookmarks(prev => {
      const newBookmarks = prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId];
      
      localStorage.setItem('recipeBookmarks', JSON.stringify(newBookmarks));
      
      // 使用統計を更新
      setUsageStats(prevStats => ({
        ...prevStats,
        favoriteRecipes: newBookmarks.length
      }));
      
      return newBookmarks;
    });
  }, []);

  const updateMemo = useCallback((recipeId, memo) => {
    setMemos(prev => ({
      ...prev,
      [recipeId]: memo
    }));
  }, []);

  const optimizedIngredientsUpdate = useCallback((recipeIndex, newIngredients) => {
    setOpenRecipes(prev => {
      const newRecipes = [...prev];
      newRecipes[recipeIndex] = {
        ...newRecipes[recipeIndex],
        ingredients: newIngredients
      };
      return newRecipes;
    });
  }, []);

  // 統計情報をローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('usageStats', JSON.stringify(usageStats));
  }, [usageStats]);

  // ナビゲーションタブの切り替え
  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setSearchQuery('');
    }
  };

  return (
    <div className="App">
      {/* PWAインストールプロンプト */}
      {showInstallPrompt && (
        <div className="install-prompt">
          <div className="install-content">
            <span>📱 レシピアプリをホーム画面に追加しますか？</span>
            <div className="install-buttons">
              <button onClick={handleInstall} className="install-yes">
                追加
              </button>
              <button 
                onClick={() => setShowInstallPrompt(false)} 
                className="install-no"
              >
                後で
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <header className="header">
        <h1 className="app-title">🍳 レシピアプリ</h1>
        <div className="header-stats">
          <span className="stat-item">📖 {usageStats.totalRecipesViewed}回閲覧</span>
          <span className="stat-item">⭐ {usageStats.favoriteRecipes}お気に入り</span>
        </div>
      </header>

      {/* ナビゲーションタブ */}
      <nav className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => switchTab('home')}
        >
          🏠 ホーム
        </button>
        <button 
          className={`nav-tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => switchTab('bookmarks')}
        >
          ⭐ お気に入り ({bookmarks.length})
        </button>
        <button 
          className={`nav-tab ${activeTab === 'world' ? 'active' : ''}`}
          onClick={() => switchTab('world')}
        >
          🌍 世界のレシピ
        </button>
        {openRecipes.length > 0 && (
          <button 
            className={`nav-tab ${activeTab === 'recipe' ? 'active' : ''}`}
            onClick={() => switchTab('recipe')}
          >
            📄 レシピ ({openRecipes.length})
          </button>
        )}
      </nav>

      {/* メインコンテンツ */}
      <main className="main-content">
        {activeTab === 'home' && (
          <div className="home-content">
            <div className="search-container">
              <input
                type="text"
                placeholder="レシピを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="recipe-grid">
              {filteredRecipes.map((recipe) => (
                <div key={recipe.id} className="recipe-card">
                  <LazyImage 
                    src={recipe.image} 
                    alt={recipe.name}
                    className="recipe-image"
                  />
                  <div className="recipe-info">
                    <h3 className="recipe-title">{recipe.name}</h3>
                    <p className="recipe-description">{recipe.description}</p>
                    <div className="recipe-meta">
                      <span className="cooking-time">⏱ {recipe.cookingTime}</span>
                      <span className="difficulty">📊 {recipe.difficulty}</span>
                      <span className="servings">👥 {recipe.servings}人分</span>
                    </div>
                    <div className="recipe-actions">
                      <button 
                        onClick={() => openRecipe(recipe)}
                        className="btn-primary"
                      >
                        レシピを見る
                      </button>
                      <button
                        onClick={() => toggleBookmark(recipe.id)}
                        className={`btn-bookmark ${bookmarks.includes(recipe.id) ? 'bookmarked' : ''}`}
                      >
                        {bookmarks.includes(recipe.id) ? '⭐' : '☆'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="bookmarks-content">
            <h2>⭐ お気に入りレシピ</h2>
            {bookmarkedRecipes.length === 0 ? (
              <div className="empty-state">
                <p>まだお気に入りのレシピがありません</p>
                <button onClick={() => switchTab('home')} className="btn-primary">
                  レシピを探す
                </button>
              </div>
            ) : (
              <div className="recipe-grid">
                {bookmarkedRecipes.map((recipe) => (
                  <div key={recipe.id} className="recipe-card">
                    <LazyImage 
                      src={recipe.image} 
                      alt={recipe.name}
                      className="recipe-image"
                    />
                    <div className="recipe-info">
                      <h3 className="recipe-title">{recipe.name}</h3>
                      <p className="recipe-description">{recipe.description}</p>
                      <div className="recipe-meta">
                        <span className="cooking-time">⏱ {recipe.cookingTime}</span>
                        <span className="difficulty">📊 {recipe.difficulty}</span>
                        <span className="servings">👥 {recipe.servings}人分</span>
                      </div>
                      <div className="recipe-actions">
                        <button 
                          onClick={() => openRecipe(recipe)}
                          className="btn-primary"
                        >
                          レシピを見る
                        </button>
                        <button
                          onClick={() => toggleBookmark(recipe.id)}
                          className="btn-bookmark bookmarked"
                        >
                          ⭐
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'world' && (
          <div className="world-recipes-content">
            <h2>🌍 世界のレシピ</h2>
            <p className="world-description">
              世界各国の本格的なレシピを日本語で楽しめます
            </p>
            
            {worldRecipes.length === 0 && isLoadingWorldRecipes && (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>世界のレシピを読み込み中...</p>
              </div>
            )}
            
            {worldRecipesError && (
              <div className="error-state">
                <p>❌ {worldRecipesError}</p>
                <button onClick={() => window.location.reload()} className="btn-primary">
                  再読み込み
                </button>
              </div>
            )}
            
            {worldRecipes.length > 0 && (
              <div className="recipe-grid">
                {worldRecipes.map((recipe) => (
                  <div key={recipe.id} className="recipe-card world-recipe">
                    <LazyImage 
                      src={recipe.image} 
                      alt={recipe.name}
                      className="recipe-image"
                    />
                    <div className="recipe-info">
                      <div className="world-badge">
                        {recipe.translatedWithClaude ? '🤖 AI翻訳' : '📖 辞書翻訳'}
                      </div>
                      <h3 className="recipe-title">{recipe.name}</h3>
                      <p className="recipe-description">{recipe.description}</p>
                      <div className="recipe-meta">
                        <span className="cooking-time">⏱ {recipe.cookingTime}</span>
                        <span className="difficulty">📊 {recipe.difficulty}</span>
                        <span className="servings">👥 {recipe.servings}人分</span>
                      </div>
                      <div className="recipe-actions">
                        <button 
                          onClick={() => openRecipe(recipe)}
                          className="btn-primary"
                        >
                          レシピを見る
                        </button>
                        <button
                          onClick={() => toggleBookmark(recipe.id)}
                          className={`btn-bookmark ${bookmarks.includes(recipe.id) ? 'bookmarked' : ''}`}
                        >
                          {bookmarks.includes(recipe.id) ? '⭐' : '☆'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {worldRecipes.length > 0 && displayedWorldRecipesCount < 50 && (
              <div className="load-more-container">
                <button 
                  onClick={loadMoreWorldRecipes}
                  disabled={isLoadingWorldRecipes}
                  className="btn-load-more"
                >
                  {isLoadingWorldRecipes ? '⏳ 読み込み中...' : '🍽 もっと見る'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recipe' && openRecipes.length > 0 && (
          <div className="recipe-detail-content">
            {/* レシピタブ */}
            {openRecipes.length > 1 && (
              <div className="recipe-tabs">
                {openRecipes.map((recipe, index) => (
                  <button
                    key={recipe.id}
                    className={`recipe-tab ${activeRecipeIndex === index ? 'active' : ''}`}
                    onClick={() => setActiveRecipeIndex(index)}
                  >
                    {recipe.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeRecipe(index);
                      }}
                      className="close-tab"
                    >
                      ×
                    </button>
                  </button>
                ))}
              </div>
            )}

            {/* レシピ詳細 */}
            {openRecipes[activeRecipeIndex] && (
              <div className="recipe-detail">
                <div className="recipe-header">
                  <LazyImage 
                    src={openRecipes[activeRecipeIndex].image} 
                    alt={openRecipes[activeRecipeIndex].name}
                    className="recipe-detail-image"
                  />
                  <div className="recipe-header-info">
                    <h1 className="recipe-title">{openRecipes[activeRecipeIndex].name}</h1>
                    <p className="recipe-description">{openRecipes[activeRecipeIndex].description}</p>
                    <div className="recipe-meta">
                      <span className="cooking-time">⏱ {openRecipes[activeRecipeIndex].cookingTime}</span>
                      <span className="difficulty">📊 {openRecipes[activeRecipeIndex].difficulty}</span>
                      <span className="servings">👥 {openRecipes[activeRecipeIndex].servings}人分</span>
                    </div>
                    <div className="recipe-actions">
                      <button
                        onClick={() => toggleBookmark(openRecipes[activeRecipeIndex].id)}
                        className={`btn-bookmark ${bookmarks.includes(openRecipes[activeRecipeIndex].id) ? 'bookmarked' : ''}`}
                      >
                        {bookmarks.includes(openRecipes[activeRecipeIndex].id) ? '⭐ お気に入り解除' : '☆ お気に入り追加'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 材料セクション */}
                <section className="recipe-section">
                  <h2>🥬 材料</h2>
                  <ul className="ingredients-list">
                    {openRecipes[activeRecipeIndex].ingredients.map((ingredient, index) => (
                      <li key={index} className="ingredient-item">
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                  
                  {/* 賢い食材使い切り機能 */}
                  <IngredientOptimizer
                    recipe={openRecipes[activeRecipeIndex]}
                    ingredients={openRecipes[activeRecipeIndex].ingredients}
                    onOptimizedIngredientsUpdate={(newIngredients) => 
                      optimizedIngredientsUpdate(activeRecipeIndex, newIngredients)
                    }
                    onSelectionCountChange={setIngredientCount}
                  />
                </section>

                {/* 作り方セクション */}
                <section className="recipe-section">
                  <h2>👩‍🍳 作り方</h2>
                  <ol className="instructions-list">
                    {openRecipes[activeRecipeIndex].instructions.map((instruction, index) => (
                      <li key={index} className="instruction-item">
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </section>

                {/* 料理のコツ */}
                {openRecipes[activeRecipeIndex].tips && (
                  <section className="recipe-section">
                    <h2>💡 料理のコツ</h2>
                    <ul className="tips-list">
                      {openRecipes[activeRecipeIndex].tips.map((tip, index) => (
                        <li key={index} className="tip-item">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* 副菜提案 */}
                {openRecipes[activeRecipeIndex].sideDishes && (
                  <section className="recipe-section">
                    <h2>🍽 おすすめ副菜</h2>
                    <ul className="side-dishes-list">
                      {openRecipes[activeRecipeIndex].sideDishes.map((dish, index) => (
                        <li key={index} className="side-dish-item">
                          {dish}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* メモ機能 */}
                <section className="recipe-section">
                  <h2>📝 メモ</h2>
                  <textarea
                    value={memos[openRecipes[activeRecipeIndex].id] || ''}
                    onChange={(e) => updateMemo(openRecipes[activeRecipeIndex].id, e.target.value)}
                    placeholder="レシピについてのメモを書いてください..."
                    className="memo-textarea"
                  />
                </section>
              </div>
            )}
          </div>
        )}
        
        {notification && (
          <div className="notification-toast">
            {notification}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;