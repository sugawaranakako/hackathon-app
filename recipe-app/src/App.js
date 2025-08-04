import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { recipesData } from './data/recipes';
import LazyImage from './components/LazyImage';
import IngredientOptimizer from './components/IngredientOptimizer';

function App() {
  const [openRecipes, setOpenRecipes] = useState([]);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [bookmarks, setBookmarks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('すべて');
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [selectedServings, setSelectedServings] = useState({});
  const [timers, setTimers] = useState({});
  const [timerIntervals, setTimerIntervals] = useState({});
  const [showRecipeList, setShowRecipeList] = useState(true);
  const [notification, setNotification] = useState(null);
  const [memos, setMemos] = useState({});
  const [worldRecipes, setWorldRecipes] = useState([]);
  const [isLoadingWorldRecipes, setIsLoadingWorldRecipes] = useState(false);
  const [worldRecipesError, setWorldRecipesError] = useState(null);
  const [hasLoadedInitialRecipes, setHasLoadedInitialRecipes] = useState(false);
  const [displayedWorldRecipesCount, setDisplayedWorldRecipesCount] = useState(8);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [cookingMode, setCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [shoppingList, setShoppingList] = useState([]);
  const [editingShoppingItem, setEditingShoppingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('その他');
  const [activeRecipeTab, setActiveRecipeTab] = useState('recipe');
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(null);
  const [isSmartIngredientsExpanded, setIsSmartIngredientsExpanded] = useState(false);
  const [selectedIngredientsCount, setSelectedIngredientsCount] = useState(0);
  const [optimizedIngredients, setOptimizedIngredients] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('checkedIngredients');
    if (saved) {
      setCheckedIngredients(JSON.parse(saved));
    }
    
    const savedMemos = localStorage.getItem('recipeMemos');
    if (savedMemos) {
      setMemos(JSON.parse(savedMemos));
    }
    
    const savedShoppingList = localStorage.getItem('shoppingList');
    if (savedShoppingList) {
      setShoppingList(JSON.parse(savedShoppingList));
    }
    
    const savedWeeklyMenu = localStorage.getItem('weeklyMenu');
    if (savedWeeklyMenu) {
      setWeeklyMenu(JSON.parse(savedWeeklyMenu));
    }
    
    const savedCurrentWeek = localStorage.getItem('currentWeekStart');
    if (savedCurrentWeek) {
      setCurrentWeekStart(savedCurrentWeek);
    } else {
      // 今週の月曜日を取得
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
      const weekStart = monday.toISOString().split('T')[0];
      setCurrentWeekStart(weekStart);
      localStorage.setItem('currentWeekStart', weekStart);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('checkedIngredients', JSON.stringify(checkedIngredients));
  }, [checkedIngredients]);

  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    localStorage.setItem('weeklyMenu', JSON.stringify(weeklyMenu));
  }, [weeklyMenu]);

  // PWAインストール促進機能
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // ブラウザのデフォルトのインストールプロンプトを阻止
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
      console.log('PWA install prompt available');
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      setNotification('アプリがホーム画面に追加されました！');
      setTimeout(() => setNotification(null), 3000);
    };

    // 実際のbeforeinstallpromptイベントをリッスン
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      
      // 開発環境またはPWA条件未満の場合の案内
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isHttps = window.location.protocol === 'https:';
      
      if (isLocalhost && !isHttps) {
        setNotification('開発環境です。本番環境(HTTPS)でお試しください。');
      } else if (!isHttps) {
        setNotification('PWAインストールにはHTTPS接続が必要です。');
      } else {
        setNotification('ブラウザメニューから「ホーム画面に追加」をお試しください。');
      }
      
      // 手動インストールガイドを表示
      setShowInstallGuide(true);
      setTimeout(() => {
        setNotification(null);
        setShowInstallGuide(false);
      }, 8000);
      return;
    }

    try {
      // promptメソッドが存在するかチェック
      if (typeof deferredPrompt.prompt !== 'function') {
        console.log('Prompt method not available');
        setNotification('現在インストールできません。後でもう一度お試しください。');
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      // インストールプロンプトを表示
      await deferredPrompt.prompt();
      
      // ユーザーの選択を待つ
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setNotification('アプリをインストール中...');
      } else {
        console.log('User dismissed the install prompt');
        setNotification('インストールがキャンセルされました');
      }
      
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error during install:', error);
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
          const translatedRecipes = data.meals.slice(0, 5).map((meal, index) => {
            const ingredients = [];
            for (let i = 1; i <= 20; i++) {
              const ingredient = meal[`strIngredient${i}`];
              const measure = meal[`strMeasure${i}`];
              if (ingredient && ingredient.trim()) {
                const translatedMeasure = translateMeasure(measure || '');
                ingredients.push(`${translateIngredient(ingredient)} ${translatedMeasure}`.trim());
              }
            }
            
            const instructions = translateInstructions(
              meal.strInstructions
                .split('\n')
                .filter(step => step.trim())
                .map((step, i) => `${i + 1}. ${step.trim()}`)
            );
            
            // コツと副菜を自動生成
            const { tips, sideDishes } = generateTipsAndSideDishes(meal.strMeal, meal.strArea);
            
            return {
              id: `world-${meal.idMeal}`,
              name: translateMealName(meal.strMeal),
              description: `${translationSystem.translate(meal.strArea)}料理 - ${translationSystem.translate(meal.strCategory)}`,
              image: meal.strMealThumb,
              cookingTime: '30分',
              difficulty: '普通',
              servings: 2,
              ingredients: ingredients,
              instructions: instructions,
              tips: tips,
              sideDishes: sideDishes,
              isWorldRecipe: true
            };
          });
          
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
  
  // インフィニットスクロールの実装
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 1000 && // 1000px手前でトリガー
        !isLoadingWorldRecipes &&
        displayedWorldRecipesCount < worldRecipes.length + 50 // 最大限界を設定
      ) {
        loadMoreWorldRecipes();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingWorldRecipes, displayedWorldRecipesCount, worldRecipes.length]);
  
  // 世界のレシピに基本的なコツと副菜を自動追加する関数
  const generateTipsAndSideDishes = (mealName, area) => {
    const name = mealName.toLowerCase();
    const region = area?.toLowerCase() || '';
    
    // 料理タイプ別のコツ
    let tips = [];
    if (name.includes('pasta') || name.includes('spaghetti')) {
      tips = [
        "パスタの茹で汁を少し残しておくと、ソースがよく絡みます",
        "アルデンテに茹でるのがポイントです",
        "最後にオリーブオイルを加えて風味をプラス"
      ];
    } else if (name.includes('curry') || name.includes('masala')) {
      tips = [
        "スパイスは弱火でじっくり炒めると香りが立ちます",
        "玉ねぎをしっかり炒めることで甘みとコクが出ます",
        "一晩寝かせるとさらに美味しくなります"
      ];
    } else if (name.includes('chicken') || name.includes('beef') || name.includes('pork')) {
      tips = [
        "肉は常温に戻してから調理すると均一に火が通ります",
        "強火で表面を焼いて旨味を閉じ込めましょう",
        "休ませる時間も大切です"
      ];
    } else if (name.includes('soup') || name.includes('broth')) {
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
    if (region.includes('italian') || name.includes('pasta')) {
      sideDishes = ["シーザーサラダ", "ガーリックブレッド", "ミネストローネ"];
    } else if (region.includes('indian') || name.includes('curry')) {
      sideDishes = ["バスマティライス", "ナン", "ヨーグルトサラダ"];
    } else if (region.includes('chinese') || region.includes('thai')) {
      sideDishes = ["白いご飯", "春雨サラダ", "わかめスープ"];
    } else if (region.includes('mexican')) {
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
        const translatedRecipes = data.meals.slice(0, 6).map((meal) => {
          const ingredients = [];
          for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
              const translatedMeasure = translateMeasure(measure || '');
              ingredients.push(`${translateIngredient(ingredient)} ${translatedMeasure}`.trim());
            }
          }
          
          const instructions = translateInstructions(
            meal.strInstructions
              .split('\n')
              .filter(step => step.trim())
              .map((step, i) => `${i + 1}. ${step.trim()}`)
          );
          
          // コツと副菜を自動生成
          const { tips, sideDishes } = generateTipsAndSideDishes(meal.strMeal, meal.strArea);
          
          return {
            id: `world-${meal.idMeal}-${Date.now()}-${Math.random()}`, // 重複防止
            name: translateMealName(meal.strMeal),
            description: `${translationSystem.translate(meal.strArea)}料理 - ${translationSystem.translate(meal.strCategory)}`,
            image: meal.strMealThumb,
            cookingTime: '30分',
            difficulty: '普通',
            servings: 2,
            ingredients: ingredients,
            instructions: instructions,
            tips: tips,
            sideDishes: sideDishes,
            isWorldRecipe: true
          };
        });
        
        setWorldRecipes(prev => [...prev, ...translatedRecipes]);
        setDisplayedWorldRecipesCount(prev => prev + 6);
      }
    } catch (error) {
      console.log('追加世界レシピ読み込みエラー:', error);
    } finally {
      setIsLoadingWorldRecipes(false);
    }
  }, [isLoadingWorldRecipes]);

  const allRecipes = useMemo(() => [...recipesData, ...worldRecipes], [worldRecipes]);
  
  const categories = ['すべて', '和食', 'パスタ', '中華', 'カレー', '丼もの', '世界の料理'];
  const ingredients = ['鶏肉', '豚肉', '牛肉', '卵', '玉ねぎ', 'きのこ', 'トマト', 'じゃがいも'];
  
  const getRecipeCategory = (recipe) => {
    if (!recipe || !recipe.name) return '和食';
    
    const name = recipe.name.toLowerCase();
    const recipeId = String(recipe.id || ''); // 数値IDも文字列に変換
    
    // 日本のレシピのカテゴリー分け
    if (!recipeId.startsWith('world-')) {
      if (name.includes('パスタ') || name.includes('スパゲティ')) return 'パスタ';
      if (name.includes('カレー')) return 'カレー';
      if (name.includes('丼') || name.includes('ごはん')) return '丼もの';
      if (name.includes('麻婆') || name.includes('中華') || name.includes('チャーハン')) return '中華';
      return '和食';
    }
    
    // 世界のレシピのカテゴリー分け
    if (name.includes('パスタ') || name.includes('スパゲティ') || name.includes('pasta') || name.includes('spaghetti')) return 'パスタ';
    if (name.includes('カレー') || name.includes('curry')) return 'カレー';
    if (name.includes('中華') || name.includes('chinese') || name.includes('チャーハン')) return '中華';
    
    return '世界の料理';
  };
  
  const filteredRecipes = useMemo(() => {
    return allRecipes.filter(recipe => {
      // テキスト検索
      const matchesSearch = searchQuery === '' || 
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // カテゴリーフィルター
      const matchesCategory = selectedCategory === 'すべて' || getRecipeCategory(recipe) === selectedCategory;
      
      // 食材フィルター
      const matchesIngredient = selectedIngredient === '' ||
        recipe.ingredients.some(ingredient => ingredient.includes(selectedIngredient)) ||
        recipe.name.includes(selectedIngredient);
      
      return matchesSearch && matchesCategory && matchesIngredient;
    });
  }, [allRecipes, searchQuery, selectedCategory, selectedIngredient]);
  
  // セクション別にレシピを振り分け
  const sectionRecipes = useMemo(() => {
    const summer = allRecipes.filter(recipe => {
      const name = recipe.name.toLowerCase();
      return name.includes('冷やし') || name.includes('サラダ') || name.includes('サラダ') || 
             name.includes('そうめん') || name.includes('冷たい') || 
             name.includes('トマト') || name.includes('さっぱり');
    }).slice(0, 8);
    
    const quick = allRecipes.filter(recipe => {
      const name = recipe.name.toLowerCase();
      const time = recipe.cookingTime;
      return name.includes('簡単') || name.includes('時短') || 
             time.includes('10分') || time.includes('15分') ||
             name.includes('焼き') || name.includes('炒め');
    }).slice(0, 8);
    
    const popular = [...allRecipes].sort(() => 0.5 - Math.random()).slice(0, 6);
    
    const withEgg = allRecipes.filter(recipe => {
      const name = recipe.name.toLowerCase();
      return name.includes('卵') || name.includes('親子') || 
             name.includes('オムレツ') || name.includes('目玉');
    }).slice(0, 8);
    
    const hearty = allRecipes.filter(recipe => {
      const name = recipe.name.toLowerCase();
      return name.includes('カレー') || name.includes('丼') || 
             name.includes('肉') || name.includes('ハンバーグ') ||
             name.includes('ステーキ') || name.includes('照り焼き');
    }).slice(0, 8);
    
    const healthy = allRecipes.filter(recipe => {
      const name = recipe.name.toLowerCase();
      return name.includes('サラダ') || name.includes('野菜') || 
             name.includes('蒸し') || name.includes('ヘルシー') ||
             name.includes('ひじき') || name.includes('さっぱり');
    }).slice(0, 8);
    
    return { summer, quick, popular, withEgg, hearty, healthy };
  }, [allRecipes]);
  
  // 絞り込みをクリア
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('すべて');
    setSelectedIngredient('');
  };
  
  const getActiveFilterText = () => {
    const filters = [];
    if (searchQuery) filters.push(`"検索: ${searchQuery}"`);
    if (selectedCategory !== 'すべて') filters.push(`カテゴリ: ${selectedCategory}`);
    if (selectedIngredient) filters.push(`食材: ${selectedIngredient}`);
    return filters.length > 0 ? filters.join(' ・ ') + 'で絞り込み中' : '';
  };

  const toggleIngredient = (recipeId, ingredientIndex) => {
    const key = `${recipeId}-${ingredientIndex}`;
    setCheckedIngredients(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleAllIngredients = (recipeId, ingredientsLength, checkAll) => {
    const updates = {};
    for (let i = 0; i < ingredientsLength; i++) {
      const key = `${recipeId}-${i}`;
      updates[key] = checkAll;
    }
    setCheckedIngredients(prev => ({
      ...prev,
      ...updates
    }));
  };

  const getCheckedCount = (recipeId, ingredientsLength) => {
    let count = 0;
    for (let i = 0; i < ingredientsLength; i++) {
      const key = `${recipeId}-${i}`;
      if (checkedIngredients[key]) count++;
    }
    return count;
  };

  const toggleBookmark = (recipeId) => {
    setBookmarks(prev =>
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const bookmarkedRecipes = allRecipes.filter(recipe =>
    bookmarks.includes(recipe.id)
  );

  // Recipe tab management
  const openRecipe = (recipe) => {
    
    // Check if recipe is already open
    if (openRecipes.find(r => r.id === recipe.id)) {
      // Switch to existing tab
      const index = openRecipes.findIndex(r => r.id === recipe.id);
      setActiveRecipeIndex(index);
      setShowRecipeList(false);
      return;
    }

    // Add new recipe (max 3 tabs)
    if (openRecipes.length >= 3) {
      // Show notification and replace the oldest tab (first one)
      const oldestRecipe = openRecipes[openRecipes.length - 1];
      const message = `最大3つまでしか開けません。「${oldestRecipe.name}」を閉じて「${recipe.name}」を開きます。`;
      setNotification(message);
      setTimeout(() => {
        setNotification(null);
      }, 4000); // Hide after 4 seconds
      setOpenRecipes(prev => [recipe, ...prev.slice(0, 2)]);
      setActiveRecipeIndex(0);
    } else {
      // Add new tab
      setOpenRecipes(prev => [recipe, ...prev]);
      setActiveRecipeIndex(0);
    }
    setShowRecipeList(false);
  };

  const closeRecipe = (index) => {
    setOpenRecipes(prev => {
      const newRecipes = prev.filter((_, i) => i !== index);
      
      // If we're closing the active tab, switch to the previous tab
      if (index === activeRecipeIndex) {
        if (newRecipes.length === 0) {
          setActiveRecipeIndex(0);
          setShowRecipeList(true);
        } else if (index >= newRecipes.length) {
          setActiveRecipeIndex(newRecipes.length - 1);
        }
      } else if (index < activeRecipeIndex) {
        setActiveRecipeIndex(prev => prev - 1);
      }
      
      return newRecipes;
    });
  };

  const switchToRecipe = (index) => {
    setActiveRecipeIndex(index);
    setShowRecipeList(false);
  };

  const getCurrentRecipe = () => {
    return openRecipes[activeRecipeIndex] || null;
  };

  // Memo functions
  const updateMemo = (recipeId, memoText) => {
    setMemos(prev => ({
      ...prev,
      [recipeId]: memoText
    }));
  };

  const clearMemo = (recipeId) => {
    setMemos(prev => {
      const newMemos = { ...prev };
      delete newMemos[recipeId];
      return newMemos;
    });
  };

  // Smart ingredients functionality
  const handleOptimizedIngredientsUpdate = (recipeId, newIngredients) => {
    setOptimizedIngredients(prev => ({
      ...prev,
      [recipeId]: newIngredients
    }));
  };

  const getDisplayIngredients = (recipe) => {
    if (optimizedIngredients[recipe.id]) {
      return optimizedIngredients[recipe.id];
    }
    return getAdjustedIngredients(recipe);
  };

  // Timer functions
  const extractTimeFromStep = (step) => {
    const timeMatch = step.match(/(\d+)分/);
    if (timeMatch) {
      return parseInt(timeMatch[1]) * 60; // Convert minutes to seconds
    }
    return null;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCookingMode = () => {
    setCookingMode(!cookingMode);
  };

  const nextStep = () => {
    const currentRecipe = getCurrentRecipe();
    if (currentRecipe && currentStep < currentRecipe.instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startTimer = (recipeId, stepIndex, duration) => {
    const timerId = `${recipeId}-${stepIndex}`;
    
    // Clear existing timer if any
    if (timerIntervals[timerId]) {
      clearInterval(timerIntervals[timerId]);
    }

    setTimers(prev => ({
      ...prev,
      [timerId]: { duration, remaining: duration, isRunning: true, isPaused: false }
    }));

    const interval = setInterval(() => {
      setTimers(prev => {
        const timer = prev[timerId];
        if (!timer || !timer.isRunning || timer.isPaused) return prev;

        const newRemaining = timer.remaining - 1;
        
        if (newRemaining <= 0) {
          // Timer completed
          clearInterval(timerIntervals[timerId]);
          
          // Play alert sound
          try {
            // Use Web Audio API to generate beep sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800; // 800Hz tone
            gainNode.gain.value = 0.3;
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2); // 200ms beep
          } catch (e) {
            console.error('Failed to play sound:', e);
          }
          
          // Try vibration if available
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
          
          return {
            ...prev,
            [timerId]: { ...timer, remaining: 0, isRunning: false, isCompleted: true }
          };
        }
        
        // Warning at 30s and 10s
        if (newRemaining === 30 || newRemaining === 10) {
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 600; // 600Hz warning tone
            gainNode.gain.value = 0.2;
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1); // 100ms beep
          } catch (e) {
            console.error('Failed to play warning sound:', e);
          }
        }
        
        return {
          ...prev,
          [timerId]: { ...timer, remaining: newRemaining }
        };
      });
    }, 1000);

    setTimerIntervals(prev => ({
      ...prev,
      [timerId]: interval
    }));
  };

  const pauseTimer = (recipeId, stepIndex) => {
    const timerId = `${recipeId}-${stepIndex}`;
    
    setTimers(prev => ({
      ...prev,
      [timerId]: { ...prev[timerId], isPaused: true }
    }));
  };

  const resumeTimer = (recipeId, stepIndex) => {
    const timerId = `${recipeId}-${stepIndex}`;
    
    setTimers(prev => ({
      ...prev,
      [timerId]: { ...prev[timerId], isPaused: false }
    }));
  };

  const stopTimer = (recipeId, stepIndex) => {
    const timerId = `${recipeId}-${stepIndex}`;
    
    if (timerIntervals[timerId]) {
      clearInterval(timerIntervals[timerId]);
      setTimerIntervals(prev => {
        const newIntervals = { ...prev };
        delete newIntervals[timerId];
        return newIntervals;
      });
    }
    
    setTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[timerId];
      return newTimers;
    });
  };

  // Shopping List functions
  const addToShoppingList = (recipe) => {
    const newItems = recipe.ingredients.map(ingredient => {
      // Parse ingredient to extract name and quantity
      const match = ingredient.match(/^(.+?):\s*(.+)$/);
      const name = match ? match[1] : ingredient;
      const quantity = match ? match[2] : '';
      
      // Determine category
      const category = getIngredientCategory(name);
      
      return {
        id: `${recipe.id}-${Date.now()}-${Math.random()}`,
        recipeId: recipe.id,
        recipeName: recipe.name,
        name: name,
        quantity: quantity,
        category: category,
        checked: false,
        originalText: ingredient
      };
    });
    
    setShoppingList(prev => {
      // Merge similar items
      const merged = [...prev];
      
      newItems.forEach(newItem => {
        const existingIndex = merged.findIndex(item => 
          item.name === newItem.name && !item.checked
        );
        
        if (existingIndex >= 0) {
          // Try to merge quantities
          const existing = merged[existingIndex];
          const mergedQuantity = mergeQuantities(existing.quantity, newItem.quantity);
          merged[existingIndex] = {
            ...existing,
            quantity: mergedQuantity,
            recipeName: `${existing.recipeName}, ${newItem.recipeName}`
          };
        } else {
          merged.push(newItem);
        }
      });
      
      return merged;
    });
    
    setNotification(`${recipe.name}の材料を買い物リストに追加しました`);
    setTimeout(() => setNotification(null), 2000);
  };
  
  const getIngredientCategory = (ingredient) => {
    const categories = {
      '肉類': ['肉', '鶏', '豚', '牛', 'ベーコン', 'ハム', 'ソーセージ'],
      '野菜': ['野菜', 'トマト', 'キャベツ', '玉ねぎ', 'にんじん', 'じゃがいも', 'ピーマン', 'なす', 'きゅうり', 'レタス', '白菜', '大根', 'ねぎ', 'ほうれん草', 'ブロッコリー'],
      '調味料': ['醤油', '味噌', '塩', '砂糖', '酢', '油', 'ソース', 'マヨネーズ', 'ケチャップ', 'みりん', '酒', 'だし', 'スパイス', '胡椒'],
      'その他': []
    };
    
    const lowerIngredient = ingredient.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerIngredient.includes(keyword))) {
        return category;
      }
    }
    
    return 'その他';
  };
  
  const mergeQuantities = (qty1, qty2) => {
    // Simple implementation - can be enhanced with unit parsing
    const num1 = parseFloat(qty1) || 0;
    const num2 = parseFloat(qty2) || 0;
    
    if (num1 && num2) {
      const unit = qty1.replace(/[\d.]+/, '').trim() || qty2.replace(/[\d.]+/, '').trim();
      return `${num1 + num2}${unit}`;
    }
    
    return `${qty1}, ${qty2}`;
  };
  
  const toggleShoppingItem = (itemId) => {
    setShoppingList(prev => prev.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
  };
  
  const updateShoppingItemQuantity = (itemId, newQuantity) => {
    setShoppingList(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
    setEditingShoppingItem(null);
  };
  
  const deleteShoppingItem = (itemId) => {
    setShoppingList(prev => prev.filter(item => item.id !== itemId));
  };
  
  const addCustomShoppingItem = (name, quantity, category) => {
    const newItem = {
      id: `custom-${Date.now()}-${Math.random()}`,
      name: name,
      quantity: quantity,
      category: category || 'その他',
      checked: false,
      isCustom: true
    };
    
    setShoppingList(prev => [...prev, newItem]);
  };
  
  const clearShoppingList = () => {
    const checkedItems = shoppingList.filter(item => item.checked);
    if (checkedItems.length === 0) {
      setNotification('チェック済みの項目がありません');
      setTimeout(() => setNotification(null), 2000);
      return;
    }
    
    if (window.confirm(`チェック済みの${checkedItems.length}件を削除しますか？`)) {
      setShoppingList(prev => prev.filter(item => !item.checked));
      setNotification(`${checkedItems.length}件の項目を削除しました`);
      setTimeout(() => setNotification(null), 2000);
    }
  };
  
  const clearAllShoppingList = () => {
    if (window.confirm('買い物リストを全てクリアしますか？')) {
      setShoppingList([]);
      setNotification('買い物リストをクリアしました');
      setTimeout(() => setNotification(null), 2000);
    }
  };
  
  const shareShoppingList = () => {
    const groupedItems = {};
    shoppingList.forEach(item => {
      if (!groupedItems[item.category]) {
        groupedItems[item.category] = [];
      }
      groupedItems[item.category].push(item);
    });
    
    let text = '📝 買い物リスト\n\n';
    
    Object.entries(groupedItems).forEach(([category, items]) => {
      text += `【${category}】\n`;
      items.forEach(item => {
        const checkmark = item.checked ? '✓' : '□';
        text += `${checkmark} ${item.name} ${item.quantity}\n`;
      });
      text += '\n';
    });
    
    text += `作成: ${new Date().toLocaleDateString('ja-JP')}`;
    
    if (navigator.share) {
      navigator.share({
        title: '買い物リスト',
        text: text
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        setNotification('買い物リストをコピーしました');
        setTimeout(() => setNotification(null), 2000);
      });
    }
  };
  
  const toggleAllShoppingItems = (checked) => {
    setShoppingList(prev => prev.map(item => ({ ...item, checked })));
  };

  // Weekly Menu Functions
  const generateWeeklyMenu = () => {
    const newMenu = [];
    
    console.log('Total recipes available:', allRecipes.length);
    
    // レシピをカテゴリ別に分類（より寛容な条件）
    const categorizedRecipes = {
      japanese: allRecipes.filter(recipe => {
        const name = (recipe.name || recipe.strMeal || '').toLowerCase();
        const area = (recipe.strArea || '').toLowerCase();
        return name.includes('味噌') || name.includes('醤油') || 
               name.includes('和風') || name.includes('だし') ||
               name.includes('照り') || name.includes('煮物') ||
               recipe.category === '和食' || area === 'japanese';
      }),
      western: allRecipes.filter(recipe => {
        const name = (recipe.name || recipe.strMeal || '').toLowerCase();
        const area = (recipe.strArea || '').toLowerCase();
        return name.includes('パスタ') || name.includes('グラタン') ||
               name.includes('ステーキ') || name.includes('オムライス') ||
               name.includes('ハンバーグ') || recipe.category === '洋食' ||
               area === 'italian' || area === 'french' || area === 'american';
      }),
      chinese: allRecipes.filter(recipe => {
        const name = (recipe.name || recipe.strMeal || '').toLowerCase();
        const area = (recipe.strArea || '').toLowerCase();
        return name.includes('炒め') || name.includes('麻婆') ||
               name.includes('中華') || name.includes('酢豚') ||
               recipe.category === '中華' || area === 'chinese';
      }),
      light: allRecipes.filter(recipe => {
        const name = (recipe.name || recipe.strMeal || '').toLowerCase();
        return name.includes('サラダ') || name.includes('スープ') ||
               name.includes('蒸し') || recipe.difficulty === '簡単';
      })
    };
    
    console.log('Categorized recipes:', {
      japanese: categorizedRecipes.japanese.length,
      western: categorizedRecipes.western.length,
      chinese: categorizedRecipes.chinese.length,
      light: categorizedRecipes.light.length
    });
    
    // バランスの良い組み合わせパターン
    const weekPattern = ['japanese', 'western', 'chinese', 'light', 'japanese', 'western', 'chinese'];
    const usedRecipes = new Set();
    
    for (let i = 0; i < 7; i++) {
      const categoryType = weekPattern[i];
      let availableRecipes = categorizedRecipes[categoryType];
      
      // カテゴリにレシピがない場合は全レシピから選択
      if (!availableRecipes || availableRecipes.length === 0) {
        availableRecipes = allRecipes;
        console.log(`No recipes found for category ${categoryType}, using all recipes`);
      }
      
      // 未使用のレシピから選択
      const unusedRecipes = availableRecipes.filter(recipe => !usedRecipes.has(recipe.id || recipe.idMeal));
      const recipesToChooseFrom = unusedRecipes.length > 0 ? unusedRecipes : availableRecipes;
      
      console.log(`Day ${i + 1} (${categoryType}): ${recipesToChooseFrom.length} recipes available`);
      
      // ランダムに選択
      const selectedRecipe = recipesToChooseFrom.length > 0 ? 
        recipesToChooseFrom[Math.floor(Math.random() * recipesToChooseFrom.length)] : null;
      
      if (selectedRecipe) {
        usedRecipes.add(selectedRecipe.id || selectedRecipe.idMeal);
        newMenu.push(selectedRecipe);
        console.log(`Selected: ${selectedRecipe.name || selectedRecipe.strMeal}`);
      } else {
        newMenu.push(null);
        console.log('No recipe selected for day', i + 1);
      }
    }
    
    console.log('Generated menu:', newMenu);
    console.log('Menu length:', newMenu.length);
    
    setWeeklyMenu(newMenu);
    localStorage.setItem('weeklyMenu', JSON.stringify(newMenu));
    
    if (newMenu.length > 0) {
      setNotification('今週の献立を生成しました！');
    } else {
      setNotification('献立の生成に失敗しました。レシピデータを確認してください。');
    }
    setTimeout(() => setNotification(null), 3000);
  };
  
  const selectBalancedRecipe = (recipes, usedRecipes) => {
    // 栄養バランスを考慮したレシピ選択
    const scoredRecipes = recipes.map(recipe => {
      let score = Math.random() * 10; // ベーススコア
      
      // 栄養価で加点
      const nutrition = calculateNutrition(recipe);
      if (nutrition.protein > 15) score += 2; // 高タンパク
      if (nutrition.calories < 500) score += 1; // 適度なカロリー
      if (nutrition.fiber > 3) score += 1; // 食物繊維豊富
      
      // 調理時間で加点（平日は短時間優先）
      if (recipe.cookingTime && recipe.cookingTime.includes('15分')) score += 1;
      if (recipe.cookingTime && recipe.cookingTime.includes('30分')) score += 0.5;
      
      return { recipe, score };
    });
    
    // スコアが高い順にソートして上位から選択
    scoredRecipes.sort((a, b) => b.score - a.score);
    return scoredRecipes[0]?.recipe || recipes[0];
  };
  
  const getDateForDay = (weekStart, dayIndex) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    return date.toISOString().split('T')[0];
  };
  
  const updateMenuRecipe = (dayKey, mealType, newRecipe) => {
    setWeeklyMenu(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [mealType]: newRecipe
      }
    }));
  };
  
  const toggleMealCompleted = (dayKey, mealType) => {
    setWeeklyMenu(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [`${mealType}Completed`]: !prev[dayKey]?.[`${mealType}Completed`]
      }
    }));
  };
  
  const skipMeal = (dayKey, mealType) => {
    setWeeklyMenu(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [mealType]: null,
        [`${mealType}Skipped`]: true
      }
    }));
  };
  
  const generateWeeklyShoppingList = () => {
    try {
      console.log('Weekly menu:', weeklyMenu);
      const weeklyRecipes = [];
      
      weeklyMenu.forEach(recipe => {
        if (recipe && recipe !== null) {
          weeklyRecipes.push(recipe);
        }
      });
      
      console.log('Weekly recipes for shopping:', weeklyRecipes);
      
      // 重複する材料をまとめる
      const consolidatedIngredients = {};
      
      weeklyRecipes.forEach(recipe => {
        const ingredients = recipe.ingredients || [];
        const recipeName = recipe.name || recipe.strMeal || '';
        
        console.log(`Processing recipe: ${recipeName}, ingredients:`, ingredients);
        
        ingredients.forEach(ingredient => {
          let name, quantity;
          
          // Handle different ingredient formats
          if (typeof ingredient === 'string') {
            // 材料の形式: "材料名 分量" または "材料名: 分量"
            const colonMatch = ingredient.match(/^(.+?):\s*(.+)$/);
            const spaceMatch = ingredient.match(/^(.+?)\s+([0-9]+.*|適量|少々|お好み.*|ひとつまみ.*)$/);
            
            if (colonMatch) {
              name = colonMatch[1].trim();
              quantity = colonMatch[2].trim();
            } else if (spaceMatch) {
              name = spaceMatch[1].trim();
              quantity = spaceMatch[2].trim();
            } else {
              name = ingredient.trim();
              quantity = '適量';
            }
          } else {
            name = ingredient.name || ingredient;
            quantity = ingredient.quantity || '適量';
          }
          
          // 空の名前をスキップ
          if (!name || name.trim() === '') return;
          
          if (consolidatedIngredients[name]) {
            // 既存の材料と合算
            const existingQty = consolidatedIngredients[name].quantity;
            const mergedQty = mergeQuantities(existingQty, quantity);
            consolidatedIngredients[name].quantity = mergedQty;
            consolidatedIngredients[name].recipes.push(recipeName);
          } else {
            consolidatedIngredients[name] = {
              quantity: quantity,
              category: getIngredientCategory(name),
              recipes: [recipeName]
            };
          }
        });
      });
      
      console.log('Consolidated ingredients:', consolidatedIngredients);
    
      // 買い物リストに追加
      const newShoppingItems = Object.entries(consolidatedIngredients).map(([name, data]) => ({
        id: `weekly-${Date.now()}-${Math.random()}`,
        name: name,
        quantity: data.quantity,
        category: data.category,
        checked: false,
        recipeName: data.recipes.join(', '),
        isWeeklyMenu: true
      }));
      
      console.log('Generated shopping items:', newShoppingItems);
      return newShoppingItems;
      
    } catch (error) {
      console.error('Error generating weekly shopping list:', error);
      return [];
    }
  };
  
  const getWeekDateRange = (weekStart) => {
    if (!weekStart) return '';
    
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(start.getDate() + 6);
    
    const formatDate = (date) => {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // Nutrition Database and Functions
  const nutritionDatabase = {
    // 基本食材の栄養価（100gあたり）
    '鶏むね肉': { calories: 108, protein: 22.3, fat: 1.5, carbs: 0, fiber: 0, salt: 0.2 },
    '鶏もも肉': { calories: 200, protein: 16.2, fat: 14.0, carbs: 0, fiber: 0, salt: 0.2 },
    '鶏肉': { calories: 154, protein: 19.25, fat: 7.75, carbs: 0, fiber: 0, salt: 0.2 },
    '豚肉': { calories: 263, protein: 17.1, fat: 21.1, carbs: 0.2, fiber: 0, salt: 0.2 },
    '豚バラ肉': { calories: 386, protein: 14.2, fat: 34.6, carbs: 0.1, fiber: 0, salt: 0.2 },
    '牛肉': { calories: 250, protein: 17.4, fat: 19.5, carbs: 0.3, fiber: 0, salt: 0.2 },
    'ひき肉': { calories: 221, protein: 19.0, fat: 15.1, carbs: 0.3, fiber: 0, salt: 0.2 },
    '卵': { calories: 151, protein: 12.3, fat: 10.3, carbs: 0.3, fiber: 0, salt: 0.4 },
    
    // 野菜類
    '玉ねぎ': { calories: 37, protein: 1.0, fat: 0.1, carbs: 8.8, fiber: 1.6, salt: 0.002 },
    'にんじん': { calories: 39, protein: 0.6, fat: 0.1, carbs: 9.3, fiber: 2.8, salt: 0.028 },
    'じゃがいも': { calories: 76, protein: 1.6, fat: 0.1, carbs: 17.6, fiber: 1.3, salt: 0.001 },
    'トマト': { calories: 19, protein: 0.7, fat: 0.1, carbs: 3.7, fiber: 1.0, salt: 0.003 },
    'キャベツ': { calories: 23, protein: 1.3, fat: 0.2, carbs: 5.2, fiber: 1.8, salt: 0.005 },
    'ピーマン': { calories: 22, protein: 0.9, fat: 0.2, carbs: 5.1, fiber: 2.3, salt: 0.001 },
    'なす': { calories: 22, protein: 1.1, fat: 0.1, carbs: 5.1, fiber: 2.2, salt: 0.001 },
    'ブロッコリー': { calories: 33, protein: 4.3, fat: 0.5, carbs: 5.2, fiber: 4.4, salt: 0.020 },
    'ほうれん草': { calories: 20, protein: 2.2, fat: 0.4, carbs: 3.1, fiber: 2.8, salt: 0.016 },
    'もやし': { calories: 14, protein: 1.4, fat: 0.1, carbs: 2.6, fiber: 1.3, salt: 0.006 },
    
    // 炭水化物
    '米': { calories: 358, protein: 6.1, fat: 0.9, carbs: 77.6, fiber: 0.5, salt: 0.001 },
    '白米': { calories: 358, protein: 6.1, fat: 0.9, carbs: 77.6, fiber: 0.5, salt: 0.001 },
    'パン': { calories: 264, protein: 9.3, fat: 4.4, carbs: 46.7, fiber: 2.3, salt: 1.3 },
    'パスタ': { calories: 378, protein: 13.0, fat: 1.5, carbs: 72.2, fiber: 2.9, salt: 0.006 },
    'うどん': { calories: 270, protein: 6.8, fat: 1.0, carbs: 56.8, fiber: 1.7, salt: 2.8 },
    'そば': { calories: 274, protein: 9.6, fat: 1.5, carbs: 54.5, fiber: 3.7, salt: 0.1 },
    
    // 調味料・油脂類
    '醤油': { calories: 71, protein: 10.9, fat: 0.1, carbs: 7.8, fiber: 0, salt: 14.5 },
    '味噌': { calories: 192, protein: 12.9, fat: 5.7, carbs: 18.0, fiber: 4.1, salt: 10.7 },
    '砂糖': { calories: 384, protein: 0, fat: 0, carbs: 99.2, fiber: 0, salt: 0 },
    '油': { calories: 921, protein: 0, fat: 100, carbs: 0.1, fiber: 0, salt: 0 },
    'オリーブオイル': { calories: 921, protein: 0, fat: 100, carbs: 0, fiber: 0, salt: 0 },
    'バター': { calories: 745, protein: 0.6, fat: 81.0, carbs: 0.2, fiber: 0, salt: 1.4 },
    '塩': { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, salt: 99.5 },
    
    // その他
    '牛乳': { calories: 67, protein: 3.3, fat: 3.8, carbs: 4.8, fiber: 0, salt: 0.1 },
    'チーズ': { calories: 339, protein: 25.7, fat: 26.0, carbs: 1.3, fiber: 0, salt: 2.8 },
    '豆腐': { calories: 72, protein: 6.6, fat: 4.2, carbs: 1.6, fiber: 0.4, salt: 0.01 },
    '納豆': { calories: 200, protein: 16.5, fat: 10.0, carbs: 12.1, fiber: 6.7, salt: 0.6 }
  };
  
  // 推奨摂取量（成人1日分）
  const dailyRecommendedIntake = {
    calories: 2000,  // kcal
    protein: 60,     // g
    fat: 55,         // g
    carbs: 300,      // g
    fiber: 20,       // g
    salt: 7.5        // g
  };
  
  const parseIngredientAmount = (ingredient) => {
    // 日本語の材料文字列から数量を抽出
    const patterns = [
      /(\d+(?:\.\d+)?)\s*g/,           // グラム
      /(\d+(?:\.\d+)?)\s*ml/,          // ミリリットル
      /(\d+(?:\.\d+)?)\s*個/,          // 個数
      /(\d+(?:\.\d+)?)\s*本/,          // 本数
      /(\d+(?:\.\d+)?)\s*枚/,          // 枚数
      /(\d+(?:\.\d+)?)\s*片/,          // 片
      /(\d+(?:\.\d+)?)\s*丁/,          // 丁
      /(\d+(?:\.\d+)?)\s*膳分/,        // 膳分
      /(\d+(?:\.\d+)?)\s*人分/,        // 人分
      /(\d+(?:\.\d+)?)\s*(大さじ|小さじ)/, // 大さじ・小さじ
      /(\d+(?:\.\d+)?)\s*カップ/,      // カップ
      /(\d+(?:\.\d+)?)\s*つ/,          // つ
      /(\d+(?:\.\d+)?)\s*箱/,          // 箱
      /(\d+(?:\.\d+)?)(?:\s|$)/        // 数字のみ（デフォルト）
    ];
    
    for (const pattern of patterns) {
      const match = ingredient.match(pattern);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    
    return 100; // デフォルト値
  };
  
  const getIngredientBaseForm = (ingredient) => {
    // 材料名から基本形を抽出（栄養価データベースのキーと照合）
    const ingredientLower = ingredient.toLowerCase();
    
    // データベースのキーと部分一致検索
    for (const key of Object.keys(nutritionDatabase)) {
      if (ingredientLower.includes(key.toLowerCase()) || 
          key.toLowerCase().includes(ingredientLower.split(/\s+/)[0])) {
        return key;
      }
    }
    
    // より柔軟なマッチング
    const matchingPatterns = {
      '鶏': '鶏肉',
      '豚': '豚肉', 
      '牛': '牛肉',
      '卵': '卵',
      '玉ねぎ': '玉ねぎ',
      'にんじん': 'にんじん',
      'じゃがいも': 'じゃがいも',
      'トマト': 'トマト',
      'キャベツ': 'キャベツ',
      'ピーマン': 'ピーマン',
      'なす': 'なす',
      '米': '白米',
      'ご飯': '白米',
      'パン': 'パン',
      'パスタ': 'パスタ',
      '醤油': '醤油',
      '味噌': '味噌',
      '砂糖': '砂糖',
      '油': '油',
      '塩': '塩',
      '牛乳': '牛乳',
      'チーズ': 'チーズ',
      '豆腐': '豆腐'
    };
    
    for (const [pattern, baseForm] of Object.entries(matchingPatterns)) {
      if (ingredientLower.includes(pattern)) {
        return baseForm;
      }
    }
    
    return null; // マッチしない場合
  };
  
  const calculateNutrition = (recipe, servings = null) => {
    const targetServings = servings || recipe.servings;
    const adjustedIngredients = getAdjustedIngredients(recipe);
    
    let totalNutrition = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
      salt: 0
    };
    
    adjustedIngredients.forEach(ingredient => {
      const amount = parseIngredientAmount(ingredient);
      const baseForm = getIngredientBaseForm(ingredient);
      
      if (baseForm && nutritionDatabase[baseForm]) {
        const nutritionPer100g = nutritionDatabase[baseForm];
        const multiplier = amount / 100; // 100gあたりの栄養価なので
        
        totalNutrition.calories += nutritionPer100g.calories * multiplier;
        totalNutrition.protein += nutritionPer100g.protein * multiplier;
        totalNutrition.fat += nutritionPer100g.fat * multiplier;
        totalNutrition.carbs += nutritionPer100g.carbs * multiplier;
        totalNutrition.fiber += nutritionPer100g.fiber * multiplier;
        totalNutrition.salt += nutritionPer100g.salt * multiplier;
      }
    });
    
    // 1人分に換算
    const perServingNutrition = {
      calories: Math.round(totalNutrition.calories / targetServings),
      protein: Math.round(totalNutrition.protein * 10 / targetServings) / 10,
      fat: Math.round(totalNutrition.fat * 10 / targetServings) / 10,
      carbs: Math.round(totalNutrition.carbs * 10 / targetServings) / 10,
      fiber: Math.round(totalNutrition.fiber * 10 / targetServings) / 10,
      salt: Math.round(totalNutrition.salt * 100 / targetServings) / 100
    };
    
    return perServingNutrition;
  };
  
  const getNutritionBadges = (nutrition) => {
    const badges = [];
    
    // カロリー基準
    if (nutrition.calories < 300) badges.push({ text: '低カロリー', color: '#4CAF50' });
    else if (nutrition.calories > 600) badges.push({ text: '高カロリー', color: '#FF5722' });
    
    // タンパク質基準
    if (nutrition.protein > 20) badges.push({ text: '高タンパク', color: '#2196F3' });
    
    // 脂質基準
    if (nutrition.fat < 10) badges.push({ text: '低脂質', color: '#8BC34A' });
    else if (nutrition.fat > 25) badges.push({ text: '高脂質', color: '#FF9800' });
    
    // 食物繊維基準
    if (nutrition.fiber > 5) badges.push({ text: '食物繊維豊富', color: '#795548' });
    
    // 塩分基準
    if (nutrition.salt < 1.5) badges.push({ text: '減塩', color: '#607D8B' });
    else if (nutrition.salt > 3) badges.push({ text: '塩分注意', color: '#F44336' });
    
    // ヘルシー判定
    if (nutrition.calories < 400 && nutrition.protein > 15 && nutrition.fat < 15 && nutrition.salt < 2) {
      badges.push({ text: 'ヘルシー', color: '#4CAF50' });
    }
    
    return badges;
  };

  
  // 強力な翻訳システム
  const createTranslationSystem = () => {
    const DEBUG_MODE = true; // デバッグモードのオン/オフ
    
    // 包括的な翻訳辞書
    const comprehensiveDict = {
      // 野菜・青果類（完全版）
      'green olives': 'グリーンオリーブ',
      'black olives': 'ブラックオリーブ',
      'olives': 'オリーブ',
      'olive': 'オリーブ',
      'green olive': 'グリーンオリーブ',
      'black olive': 'ブラックオリーブ',
      'kalamata olives': 'カラマタオリーブ',
      'stuffed olives': '詰め物入りオリーブ',
      
      // オイル・調味料類（完全版）
      'extra virgin olive oil': 'エクストラバージンオリーブオイル',
      'extra-virgin olive oil': 'エクストラバージンオリーブオイル',
      'olive oil': 'オリーブオイル',
      'vegetable oil': 'サラダ油',
      'canola oil': 'キャノーラ油',
      'sesame oil': 'ごま油',
      'coconut oil': 'ココナッツオイル',
      'sunflower oil': 'ひまわり油',
      'peanut oil': 'ピーナッツオイル',
      
      // 肉類（完全版）
      'chicken breast': '鶏むね肉',
      'chicken thigh': '鶏もも肉',
      'chicken wing': '手羽先',
      'chicken drumstick': '手羽元',
      'ground chicken': '鶏ひき肉',
      'whole chicken': '丸鶏',
      'chicken': '鶏肉',
      'beef steak': '牛ステーキ',
      'ground beef': '牛ひき肉',
      'beef chuck': '牛肩肉',
      'beef sirloin': '牛サーロイン',
      'beef tenderloin': '牛ヒレ肉',
      'beef': '牛肉',
      'pork shoulder': '豚肩肉',
      'pork chop': '豚ロース',
      'ground pork': '豚ひき肉',
      'pork belly': '豚バラ肉',
      'pork': '豚肉',
      'lamb': 'ラム肉',
      'veal': '仔牛肉',
      'duck': '鴨肉',
      'turkey': '七面鳥',
      'ham': 'ハム',
      'bacon': 'ベーコン',
      'sausage': 'ソーセージ',
      'prosciutto': 'プロシュート',
      
      // 魚介類（完全版）
      'salmon fillet': 'サーモンフィレ',
      'salmon': 'サーモン',
      'tuna': 'ツナ',
      'cod': 'タラ',
      'halibut': 'ヒラメ',
      'sea bass': 'スズキ',
      'mackerel': 'サバ',
      'sardine': 'イワシ',
      'shrimp': 'エビ',
      'prawns': 'エビ',
      'lobster': 'ロブスター',
      'crab': 'カニ',
      'scallop': 'ホタテ',
      'oyster': 'カキ',
      'clam': 'アサリ',
      'mussel': 'ムール貝',
      'squid': 'イカ',
      'octopus': 'タコ',
      'fish': '魚',
      
      // 野菜類（超完全版）
      'red onion': '赤玉ねぎ',
      'white onion': '白玉ねぎ',
      'yellow onion': '黄玉ねぎ',
      'sweet onion': '甘玉ねぎ',
      'green onion': '青ネギ',
      'spring onion': '青ネギ',
      'scallion': '青ネギ',
      'shallot': 'エシャロット',
      'leek': '長ネギ',
      'onion': '玉ねぎ',
      'onions': '玉ねぎ',
      
      'roma tomato': 'ロマトマト',
      'cherry tomato': 'ミニトマト',
      'grape tomato': 'グレープトマト',
      'beefsteak tomato': 'ビーフステーキトマト',
      'heirloom tomato': 'エアルームトマト',
      'sun-dried tomato': 'ドライトマト',
      'tomato paste': 'トマトペースト',
      'tomato sauce': 'トマトソース',
      'crushed tomato': 'クラッシュトマト',
      'diced tomato': 'ダイストマト',
      'whole tomato': 'ホールトマト',
      'tomato': 'トマト',
      'tomatoes': 'トマト',
      
      'russet potato': 'ラセット芋',
      'red potato': '赤じゃがいも',
      'fingerling potato': 'フィンガーリング芋',
      'baby potato': '小芋',
      'sweet potato': 'さつまいも',
      'potato': 'じゃがいも',
      'potatoes': 'じゃがいも',
      
      'baby carrot': 'ベビーキャロット',
      'carrot': '人参',
      'carrots': '人参',
      
      'garlic clove': 'にんにく片',
      'garlic bulb': 'にんにく玉',
      'minced garlic': 'にんにくみじん切り',
      'garlic powder': 'にんにくパウダー',
      'garlic': 'にんにく',
      
      'fresh ginger': '生姜',
      'ground ginger': '生姜パウダー',
      'ginger root': '生姜',
      'ginger': '生姜',
      
      // ハーブ・スパイス（完全版）
      'fresh basil': 'フレッシュバジル',
      'dried basil': 'ドライバジル',
      'basil leaves': 'バジルの葉',
      'thai basil': 'タイバジル',
      'basil': 'バジル',
      
      'fresh parsley': 'フレッシュパセリ',
      'dried parsley': 'ドライパセリ',
      'flat-leaf parsley': 'イタリアンパセリ',
      'curly parsley': 'カーリーパセリ',
      'parsley': 'パセリ',
      
      'fresh cilantro': 'フレッシュパクチー',
      'cilantro leaves': 'パクチーの葉',
      'cilantro': 'パクチー',
      'coriander leaves': 'パクチー',
      'fresh coriander': 'フレッシュパクチー',
      
      'fresh mint': 'フレッシュミント',
      'dried mint': 'ドライミント',
      'mint leaves': 'ミントの葉',
      'mint': 'ミント',
      
      'fresh thyme': 'フレッシュタイム',
      'dried thyme': 'ドライタイム',
      'thyme leaves': 'タイムの葉',
      'thyme': 'タイム',
      
      'fresh oregano': 'フレッシュオレガノ',
      'dried oregano': 'ドライオレガノ',
      'oregano': 'オレガノ',
      
      'fresh rosemary': 'フレッシュローズマリー',
      'dried rosemary': 'ドライローズマリー',
      'rosemary sprigs': 'ローズマリーの枝',
      'rosemary': 'ローズマリー',
      
      'bay leaf': 'ローリエ',
      'bay leaves': 'ローリエ',
      'fresh bay leaves': 'フレッシュローリエ',
      
      'black pepper': '黒こしょう',
      'white pepper': '白こしょう',
      'ground black pepper': '黒こしょうパウダー',
      'peppercorns': 'こしょうの実',
      'pepper': 'こしょう',
      
      'sea salt': '海塩',
      'kosher salt': 'コーシャーソルト',
      'table salt': '食塩',
      'coarse salt': '粗塩',
      'fine salt': '細塩',
      'salt': '塩',
      
      'paprika': 'パプリカパウダー',
      'smoked paprika': 'スモークパプリカ',
      'hot paprika': 'ホットパプリカ',
      'sweet paprika': 'スウィートパプリカ',
      
      'cumin': 'クミン',
      'ground cumin': 'クミンパウダー',
      'cumin seeds': 'クミンシード',
      
      'coriander': 'コリアンダー',
      'ground coriander': 'コリアンダーパウダー',
      'coriander seeds': 'コリアンダーシード',
      
      'turmeric': 'ターメリック',
      'ground turmeric': 'ターメリックパウダー',
      
      'curry powder': 'カレー粉',
      'garam masala': 'ガラムマサラ',
      'chili powder': 'チリパウダー',
      'cayenne pepper': 'カイエンペッパー',
      'red pepper flakes': '唐辛子フレーク',
      'crushed red pepper': '砕いた唐辛子',
      
      'cinnamon': 'シナモン',
      'ground cinnamon': 'シナモンパウダー',
      'cinnamon stick': 'シナモンスティック',
      
      'nutmeg': 'ナツメグ',
      'ground nutmeg': 'ナツメグパウダー',
      'whole nutmeg': 'ナツメグホール',
      
      'clove': 'クローブ',
      'cloves': 'クローブ',
      'ground cloves': 'クローブパウダー',
      'whole cloves': 'クローブホール',
      
      'cardamom': 'カルダモン',
      'ground cardamom': 'カルダモンパウダー',
      'cardamom pods': 'カルダモンポッド',
      
      'star anise': '八角',
      'fennel seeds': 'フェンネルシード',
      'mustard seeds': 'マスタードシード',
      'sesame seeds': 'ごま',
      'poppy seeds': 'ポピーシード',
      'saffron': 'サフラン',
      'vanilla': 'バニラ',
      'vanilla extract': 'バニラエッセンス',
      'vanilla bean': 'バニラビーンズ',
      
      // 乳製品（完全版）
      'whole milk': '全脂肪牛乳',
      'skim milk': '無脂肪牛乳',
      'low-fat milk': '低脂肪牛乳',
      '2% milk': '2%牛乳',
      'buttermilk': 'バターミルク',
      'evaporated milk': 'エバミルク',
      'condensed milk': 'コンデンスミルク',
      'milk': '牛乳',
      
      'heavy cream': '生クリーム',
      'whipping cream': 'ホイップクリーム',
      'half and half': 'ハーフアンドハーフ',
      'sour cream': 'サワークリーム',
      'cream': 'クリーム',
      
      'plain yogurt': 'プレーンヨーグルト',
      'greek yogurt': 'ギリシャヨーグルト',
      'vanilla yogurt': 'バニラヨーグルト',
      'yogurt': 'ヨーグルト',
      
      'unsalted butter': '無塩バター',
      'salted butter': '有塩バター',
      'clarified butter': '澄ましバター',
      'butter': 'バター',
      
      'cream cheese': 'クリームチーズ',
      'cottage cheese': 'カッテージチーズ',
      'ricotta cheese': 'リコッタチーズ',
      'mascarpone': 'マスカルポーネ',
      'mozzarella cheese': 'モッツァレラチーズ',
      'fresh mozzarella': 'フレッシュモッツァレラ',
      'parmesan cheese': 'パルメザンチーズ',
      'grated parmesan': 'パルメザンチーズすりおろし',
      'romano cheese': 'ロマーノチーズ',
      'cheddar cheese': 'チェダーチーズ',
      'swiss cheese': 'スイスチーズ',
      'gouda cheese': 'ゴーダチーズ',
      'brie cheese': 'ブリーチーズ',
      'camembert': 'カマンベール',
      'blue cheese': 'ブルーチーズ',
      'feta cheese': 'フェタチーズ',
      'goat cheese': 'ゴートチーズ',
      'cheese': 'チーズ',
      
      // 穀物・パン・パスタ（完全版）
      'white rice': '白米',
      'brown rice': '玄米',
      'basmati rice': 'バスマティライス',
      'jasmine rice': 'ジャスミンライス',
      'wild rice': 'ワイルドライス',
      'arborio rice': 'アルボリオ米',
      'sushi rice': 'すし米',
      'long-grain rice': '長粒米',
      'short-grain rice': '短粒米',
      'rice': '米',
      
      'all-purpose flour': '中力粉',
      'bread flour': '強力粉',
      'cake flour': '薄力粉',
      'whole wheat flour': '全粒粉',
      'self-rising flour': 'セルフレイジングフラワー',
      'pastry flour': 'ペストリーフラワー',
      'flour': '小麦粉',
      
      'white bread': '食パン',
      'whole wheat bread': '全粒粉パン',
      'sourdough bread': 'サワードウパン',
      'rye bread': 'ライ麦パン',
      'pumpernickel': 'プンパーニッケル',
      'baguette': 'バゲット',
      'ciabatta': 'チャバタ',
      'focaccia': 'フォカッチャ',
      'pita bread': 'ピタパン',
      'naan': 'ナン',
      'tortilla': 'トルティーヤ',
      'bread': 'パン',
      
      'spaghetti': 'スパゲッティ',
      'linguine': 'リングイネ',
      'fettuccine': 'フェットチーネ',
      'angel hair': 'エンジェルヘア',
      'penne': 'ペンネ',
      'rigatoni': 'リガトーニ',
      'fusilli': 'フジッリ',
      'rotini': 'ロティーニ',
      'farfalle': 'ファルファッレ',
      'bow tie pasta': '蝶々パスタ',
      'shells': 'シェルパスタ',
      'macaroni': 'マカロニ',
      'elbow macaroni': 'エルボマカロニ',
      'lasagna noodles': 'ラザニアシート',
      'ravioli': 'ラビオリ',
      'tortellini': 'トルテリーニ',
      'gnocchi': 'ニョッキ',
      'pasta': 'パスタ',
      
      // 豆類・ナッツ（完全版）
      'black beans': '黒豆',
      'kidney beans': 'キドニービーンズ',
      'pinto beans': 'ピント豆',
      'navy beans': 'ネイビービーンズ',
      'cannellini beans': 'カネリーニ豆',
      'lima beans': 'ライマ豆',
      'chickpeas': 'ひよこ豆',
      'garbanzo beans': 'ひよこ豆',
      'lentils': 'レンズ豆',
      'red lentils': '赤レンズ豆',
      'green lentils': '緑レンズ豆',
      'split peas': 'スプリットピー',
      'black-eyed peas': 'ブラックアイビーンズ',
      'edamame': '枝豆',
      'soybeans': '大豆',
      'beans': '豆',
      
      'almonds': 'アーモンド',
      'walnuts': 'くるみ',
      'pecans': 'ピーカン',
      'cashews': 'カシューナッツ',
      'pistachios': 'ピスタチオ',
      'hazelnuts': 'ヘーゼルナッツ',
      'brazil nuts': 'ブラジルナッツ',
      'macadamia nuts': 'マカダミアナッツ',
      'pine nuts': '松の実',
      'peanuts': 'ピーナッツ',
      'sunflower seeds': 'ひまわりの種',
      'pumpkin seeds': 'かぼちゃの種',
      'chia seeds': 'チアシード',
      'flax seeds': '亜麻仁',
      'sesame seeds': 'ごま',
      
      // 調味料・ソース（超完全版）
      'soy sauce': '醤油',
      'light soy sauce': '薄口醤油',
      'dark soy sauce': '濃口醤油',
      'tamari': 'たまり醤油',
      'low sodium soy sauce': '減塩醤油',
      
      'miso paste': '味噌',
      'white miso': '白味噌',
      'red miso': '赤味噌',
      'miso': '味噌',
      
      'rice vinegar': '米酢',
      'white vinegar': '白酢',
      'apple cider vinegar': 'りんご酢',
      'balsamic vinegar': 'バルサミコ酢',
      'red wine vinegar': '赤ワインビネガー',
      'white wine vinegar': '白ワインビネガー',
      'sherry vinegar': 'シェリービネガー',
      'vinegar': '酢',
      
      'cooking wine': '料理酒',
      'dry white wine': '辛口白ワイン',
      'dry red wine': '辛口赤ワイン',
      'white wine': '白ワイン',
      'red wine': '赤ワイン',
      'wine': 'ワイン',
      
      'sake': '日本酒',
      'mirin': 'みりん',
      'cooking sake': '料理酒',
      
      'honey': 'はちみつ',
      'maple syrup': 'メープルシロップ',
      'agave nectar': 'アガベシロップ',
      'corn syrup': 'コーンシロップ',
      'molasses': 'モラセス',
      
      'dijon mustard': 'ディジョンマスタード',
      'whole grain mustard': '粒マスタード',
      'yellow mustard': 'イエローマスタード',
      'dry mustard': 'マスタードパウダー',
      'mustard': 'マスタード',
      
      'ketchup': 'ケチャップ',
      'tomato ketchup': 'トマトケチャップ',
      'mayonnaise': 'マヨネーズ',
      'miracle whip': 'ミラクルホイップ',
      
      'worcestershire sauce': 'ウスターソース',
      'hot sauce': 'ホットソース',
      'tabasco': 'タバスコ',
      'sriracha': 'シラチャーソース',
      'fish sauce': '魚醤',
      'oyster sauce': 'オイスターソース',
      'hoisin sauce': '海鮮醤',
      'teriyaki sauce': '照り焼きソース',
      'bbq sauce': 'バーベキューソース',
      'steak sauce': 'ステーキソース',
      
      'pesto': 'ペスト',
      'basil pesto': 'バジルペスト',
      'sun-dried tomato pesto': 'ドライトマトペスト',
      
      'tahini': 'タヒニ',
      'sesame paste': 'ごまペースト',
      'peanut butter': 'ピーナッツバター',
      'almond butter': 'アーモンドバター',
      'cashew butter': 'カシューバター',
      
      // 単位・計量（完全版）
      'teaspoon': '小さじ',
      'teaspoons': '小さじ',
      'tsp': '小さじ',
      'tablespoon': '大さじ',
      'tablespoons': '大さじ',
      'tbsp': '大さじ',
      'cup': 'カップ',
      'cups': 'カップ',
      'pint': 'パイント',
      'pints': 'パイント',
      'quart': 'クォート',
      'quarts': 'クォート',
      'gallon': 'ガロン',
      'gallons': 'ガロン',
      'fluid ounce': 'fl oz',
      'fluid ounces': 'fl oz',
      'fl oz': 'fl oz',
      'ounce': 'オンス',
      'ounces': 'オンス',
      'oz': 'オンス',
      'pound': 'ポンド',
      'pounds': 'ポンド',
      'lb': 'ポンド',
      'lbs': 'ポンド',
      'gram': 'g',
      'grams': 'g',
      'g': 'g',
      'kilogram': 'kg',
      'kilograms': 'kg',
      'kg': 'kg',
      'liter': 'リットル',
      'liters': 'リットル',
      'l': 'L',
      'milliliter': 'ml',
      'milliliters': 'ml',
      'ml': 'ml',
      
      // 個数・数量
      'piece': '個',
      'pieces': '個',
      'slice': '枚',
      'slices': '枚',
      'clove': '片',
      'cloves': '片',
      'bunch': '束',
      'bunches': '束',
      'head': '個',
      'heads': '個',
      'bulb': '玉',
      'bulbs': '玉',
      'stalk': '本',
      'stalks': '本',
      'sprig': '枝',
      'sprigs': '枝',
      'leaf': '枚',
      'leaves': '枚',
      'can': '缶',
      'cans': '缶',
      'jar': '瓶',
      'jars': '瓶',
      'bottle': '本',
      'bottles': '本',
      'package': 'パック',
      'packages': 'パック',
      'bag': '袋',
      'bags': '袋',
      'box': '箱',
      'boxes': '箱',
      'container': '容器',
      'containers': '容器',
      
      // 調理用語（完全版）
      'bring to a boil': '沸騰させる',
      'bring to boil': '沸騰させる',
      'bring to the boil': '沸騰させる',
      'bring': '沸騰させる',
      'wash': '洗う',
      'wash the': '〜を洗う',
      'cut into': '〜に切る',
      'cut': '切る',
      'chop': '刻む',
      'dice': 'さいの目切りにする',
      'slice': 'スライスする',
      'mince': 'みじん切りにする',
      'grate': 'すりおろす',
      'peel': '皮をむく',
      'trim': '取り除く',
      'core': '芯を取る',
      'meanwhile': 'その間に',
      'sprinkle': '振りかける',
      'sprinkle with': '〜を振りかける',
      'toss': '和える',
      'toss with': '〜で和える',
      'drain': '水を切る',
      'strain': 'こす',
      'allow the flavours to mingle': '味をなじませる',
      'allow flavours to mingle': '味をなじませる',
      'let flavours mingle': '味をなじませる',
      'season': '味付けする',
      'season with': '〜で味付けする',
      'taste and adjust': '味見して調整する',
      'mix': '混ぜる',
      'stir': 'かき混ぜる',
      'whisk': '泡立てる',
      'beat': '混ぜる',
      'fold': 'さっくり混ぜる',
      'combine': '合わせる',
      'add': '加える',
      'pour': '注ぐ',
      'heat': '加熱する',
      'warm': '温める',
      'cool': '冷ます',
      'chill': '冷やす',
      'freeze': '冷凍する',
      'thaw': '解凍する',
      'melt': '溶かす',
      'boil': '茹でる',
      'simmer': '弱火で煮る',
      'steam': '蒸す',
      'fry': '揚げる',
      'sauté': 'ソテーする',
      'bake': 'オーブンで焼く',
      'roast': 'ローストする',
      'grill': 'グリルする',
      'broil': '直火で焼く',
      'toast': 'トーストする',
      'brown': 'こんがり焼く',
      'sear': '表面を焼く',
      'caramelize': 'カラメル化する',
      'reduce': '煮詰める',
      'thicken': 'とろみをつける',
      'marinate': 'マリネする',
      'serve': '盛り付ける',
      'garnish': '飾る',
      'remove': '取り除く',
      'discard': '捨てる',
      'reserve': '取っておく',
      'set aside': '取り置く',
      'transfer': '移す',
      'arrange': '並べる',
      'cover': '蓋をする',
      'uncover': '蓋を取る',
      'wrap': '包む',
      'unwrap': '包みを取る',
      'store': '保存する',
      'refrigerate': '冷蔵する',
      'rest': '休ませる',
      'stand': '置いておく',
      'let stand': 'そのまま置く',
      'cool completely': '完全に冷ます',
      'at room temperature': '室温で',
      'until tender': '柔らかくなるまで',
      'until golden': 'きつね色になるまで',
      'until done': '火が通るまで',
      'until fragrant': '香りが立つまで',
      'until smooth': 'なめらかになるまで',
      'until combined': '混ざるまで',
      'until thick': 'とろみがつくまで',
      'for': '〜間',
      'about': '約',
      'approximately': '約',
      'or until': '〜するまで',
      'minutes': '分',
      'minute': '分',
      'hours': '時間',
      'hour': '時間',
      'seconds': '秒',
      'second': '秒'
    };
    
    // カタカナ変換用の簡易辞書
    const katakanaFallback = {
      'a': 'ア', 'i': 'イ', 'u': 'ウ', 'e': 'エ', 'o': 'オ',
      'ka': 'カ', 'ki': 'キ', 'ku': 'ク', 'ke': 'ケ', 'ko': 'コ',
      'sa': 'サ', 'si': 'シ', 'su': 'ス', 'se': 'セ', 'so': 'ソ',
      'ta': 'タ', 'ti': 'チ', 'tu': 'ツ', 'te': 'テ', 'to': 'ト',
      'na': 'ナ', 'ni': 'ニ', 'nu': 'ヌ', 'ne': 'ネ', 'no': 'ノ',
      'ha': 'ハ', 'hi': 'ヒ', 'hu': 'フ', 'he': 'ヘ', 'ho': 'ホ',
      'ma': 'マ', 'mi': 'ミ', 'mu': 'ム', 'me': 'メ', 'mo': 'モ',
      'ya': 'ヤ', 'yu': 'ユ', 'yo': 'ヨ',
      'ra': 'ラ', 'ri': 'リ', 'ru': 'ル', 're': 'レ', 'ro': 'ロ',
      'wa': 'ワ', 'wo': 'ヲ', 'n': 'ン',
      'ga': 'ガ', 'gi': 'ギ', 'gu': 'グ', 'ge': 'ゲ', 'go': 'ゴ',
      'za': 'ザ', 'zi': 'ジ', 'zu': 'ズ', 'ze': 'ゼ', 'zo': 'ゾ',
      'da': 'ダ', 'di': 'ディ', 'du': 'ヅ', 'de': 'デ', 'do': 'ド',
      'ba': 'バ', 'bi': 'ビ', 'bu': 'ブ', 'be': 'ベ', 'bo': 'ボ',
      'pa': 'パ', 'pi': 'ピ', 'pu': 'プ', 'pe': 'ペ', 'po': 'ポ'
    };
    
    // 単語のカタカナ変換（フォールバック）
    const toKatakana = (word) => {
      // 基本的な英単語→カタカナ変換
      const basicConversions = {
        'pasta': 'パスタ',
        'pizza': 'ピザ',
        'sauce': 'ソース',
        'cream': 'クリーム',
        'butter': 'バター',
        'sugar': 'シュガー',
        'oil': 'オイル',
        'wine': 'ワイン',
        'beer': 'ビール',
        'coffee': 'コーヒー',
        'tea': 'ティー',
        'cake': 'ケーキ',
        'bread': 'ブレッド',
        'rice': 'ライス',
        'soup': 'スープ',
        'salad': 'サラダ',
        'meat': 'ミート',
        'fish': 'フィッシュ',
        'chicken': 'チキン',
        'beef': 'ビーフ',
        'pork': 'ポーク',
        'cheese': 'チーズ',
        'milk': 'ミルク',
        'egg': 'エッグ',
        'apple': 'アップル',
        'orange': 'オレンジ',
        'lemon': 'レモン',
        'lime': 'ライム',
        'banana': 'バナナ',
        'grape': 'グレープ',
        'tomato': 'トマト',
        'potato': 'ポテト',
        'onion': 'オニオン',
        'garlic': 'ガーリック',
        'pepper': 'ペッパー',
        'salt': 'ソルト',
        'water': 'ウォーター',
        'ice': 'アイス',
        'hot': 'ホット',
        'cold': 'コールド',
        'fresh': 'フレッシュ',
        'dry': 'ドライ',
        'wet': 'ウェット',
        'sweet': 'スウィート',
        'sour': 'サワー',
        'spicy': 'スパイシー',
        'mild': 'マイルド',
        'strong': 'ストロング',
        'light': 'ライト',
        'heavy': 'ヘビー',
        'thick': 'シック',
        'thin': 'シン',
        'large': 'ラージ',
        'small': 'スモール',
        'medium': 'ミディアム',
        'extra': 'エクストラ',
        'super': 'スーパー',
        'special': 'スペシャル',
        'premium': 'プレミアム',
        'classic': 'クラシック',
        'traditional': 'トラディショナル',
        'modern': 'モダン',
        'style': 'スタイル',
        'type': 'タイプ',
        'kind': 'カインド',
        'mix': 'ミックス',
        'blend': 'ブレンド',
        'pure': 'ピュア',
        'natural': 'ナチュラル',
        'organic': 'オーガニック'
      };
      
      const lowerWord = word.toLowerCase();
      if (basicConversions[lowerWord]) {
        return basicConversions[lowerWord];
      }
      
      // 簡易的な音韻変換（完璧ではないが、フォールバック用）
      let katakana = '';
      for (let i = 0; i < word.length; i++) {
        const char = word[i].toLowerCase();
        if (katakanaFallback[char]) {
          katakana += katakanaFallback[char];
        } else if (char === 'l') {
          katakana += 'ル';
        } else if (char === 'r') {
          katakana += 'ル';
        } else if (char === 'v') {
          katakana += 'ブ';
        } else if (char === 'f') {
          katakana += 'フ';
        } else if (char === 'th') {
          katakana += 'ス';
        } else {
          katakana += char.toUpperCase();
        }
      }
      return katakana;
    };
    
    // 翻訳漏れチェック関数
    const checkUntranslated = (text) => {
      if (!DEBUG_MODE) return [];
      
      const words = text.split(/\s+/);
      const untranslated = [];
      
      words.forEach(word => {
        const cleanWord = word.replace(/[^\w\s]/g, '').toLowerCase();
        if (cleanWord && /^[a-zA-Z]+$/.test(cleanWord) && cleanWord.length > 2) {
          if (!comprehensiveDict[cleanWord] && !comprehensiveDict[cleanWord + 's'] && !comprehensiveDict[cleanWord.slice(0, -1)]) {
            untranslated.push(cleanWord);
          }
        }
      });
      
      return [...new Set(untranslated)]; // 重複除去
    };
    
    // メイン翻訳関数
    const translate = (text, type = 'general') => {
      if (!text || typeof text !== 'string') return text;
      
      if (DEBUG_MODE) {
        console.log(`🔍 [翻訳前 ${type}]:`, text);
      }
      
      let translated = text;
      
      // 1. 長いフレーズから順に翻訳（重要：順序が大事）
      const sortedEntries = Object.entries(comprehensiveDict)
        .sort(([a], [b]) => b.length - a.length);
      
      sortedEntries.forEach(([english, japanese]) => {
        const regex = new RegExp(`\\b${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        if (regex.test(translated)) {
          translated = translated.replace(regex, japanese);
        }
      });
      
      // 2. 数字と単位のスペース統一
      translated = translated.replace(/(\\d+)\\s+(g|kg|ml|L|個|枚|片|束|本|缶|瓶|パック|袋|箱|カップ|大さじ|小さじ|ポンド|オンス)/g, '$1$2');
      
      // 3. 翻訳漏れをチェック
      const untranslated = checkUntranslated(translated);
      if (untranslated.length > 0 && DEBUG_MODE) {
        console.warn(`⚠️ 翻訳漏れ detected:`, untranslated);
        
        // フォールバック：未翻訳の単語をカタカナに変換
        untranslated.forEach(word => {
          const katakana = toKatakana(word);
          const regex = new RegExp(`\\\\b${word}\\\\b`, 'gi');
          translated = translated.replace(regex, katakana);
        });
      }
      
      if (DEBUG_MODE) {
        console.log(`✅ [翻訳後 ${type}]:`, translated);
        if (untranslated.length > 0) {
          console.log(`🔄 [フォールバック適用]:`, translated);
        }
      }
      
      return translated;
    };
    
    return {
      translate,
      checkUntranslated,
      DEBUG_MODE
    };
  };
  
  // 翻訳システムのインスタンス作成
  const translationSystem = createTranslationSystem();
  
  const translateIngredient = (ingredient) => {
    return translationSystem.translate(ingredient, 'ingredient');
  };
  
  const translateMeasure = (measure) => {
    return translationSystem.translate(measure, 'measure');
  };
  
  const translateMealName = (name) => {
    return translationSystem.translate(name, 'meal');
  };
  
  const translateInstructions = (instructions) => {
    if (!instructions) return instructions;
    
    // 文字列の場合
    if (typeof instructions === 'string') {
      return translationSystem.translate(instructions, 'instructions');
    }
    
    // 配列の場合
    if (Array.isArray(instructions)) {
      return instructions.map((step, index) => {
        const translatedStep = translationSystem.translate(step, 'instructions');
        
        // ステップ番号を保持
        if (/^\d+\./.test(translatedStep)) {
          return translatedStep;
        } else if (/^\d+/.test(step)) {
          const num = step.match(/^(\d+)/)[1];
          return translatedStep.replace(/^\d+/, `${num}.`);
        }
        
        return translatedStep;
      });
    }
    
    return instructions;
  };
  
  
  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(timerIntervals).forEach(interval => clearInterval(interval));
    };
  }, [timerIntervals]);


  const getAdjustedIngredients = (recipe) => {
    const servings = selectedServings[recipe.id] || recipe.servings;
    if (servings === recipe.servings) return recipe.ingredients;
    
    return recipe.ingredients.map(ingredient => {
      // Pattern for Japanese format: "材料名 数量単位"
      const match = ingredient.match(/^(.+?)\s+([\d./]+)(g|ml|個|本|片|膳分|丁|箱|枚|つ|人分)?$/);
      if (match) {
        const [, name, quantity, unit = ''] = match;
        const ratio = servings / recipe.servings;
        
        // Handle fractions
        if (quantity.includes('/')) {
          const [numerator, denominator] = quantity.split('/').map(Number);
          const decimal = numerator / denominator;
          const newDecimal = decimal * ratio;
          
          // Convert back to fraction if it's a simple fraction
          if (newDecimal === 0.5) return `${name} 1/2${unit}`;
          if (newDecimal === 0.25) return `${name} 1/4${unit}`;
          if (newDecimal === 0.75) return `${name} 3/4${unit}`;
          if (newDecimal === 1.5) return `${name} 1と1/2${unit}`;
          if (newDecimal === 1) return `${name} 1${unit}`;
          if (newDecimal === 2) return `${name} 2${unit}`;
          
          // Otherwise use decimal
          return `${name} ${Math.round(newDecimal * 10) / 10}${unit}`;
        }
        
        // Handle regular numbers
        const num = parseFloat(quantity);
        const newNum = num * ratio;
        const rounded = Math.round(newNum * 10) / 10;
        
        return `${name} ${rounded}${unit}`;
      }
      
      // Pattern for measurements like "大さじ2", "小さじ1"
      const measureMatch = ingredient.match(/^(.+?)(大さじ|小さじ|カップ)([\d./]+)(.*)$/);
      if (measureMatch) {
        const [, name, measure, quantity, rest] = measureMatch;
        const ratio = servings / recipe.servings;
        
        // Handle fractions
        if (quantity.includes('/')) {
          const [numerator, denominator] = quantity.split('/').map(Number);
          const decimal = numerator / denominator;
          const newDecimal = decimal * ratio;
          
          // Convert back to fraction if it's a simple fraction
          if (newDecimal === 0.5) return `${name}${measure}1/2${rest}`;
          if (newDecimal === 0.25) return `${name}${measure}1/4${rest}`;
          if (newDecimal === 0.75) return `${name}${measure}3/4${rest}`;
          if (newDecimal === 1.5) return `${name}${measure}1と1/2${rest}`;
          
          // Otherwise use decimal
          return `${name}${measure}${Math.round(newDecimal * 10) / 10}${rest}`;
        }
        
        // Handle regular numbers
        const num = parseFloat(quantity);
        const newNum = num * ratio;
        const rounded = Math.round(newNum * 10) / 10;
        
        return `${name}${measure}${rounded}${rest}`;
      }
      
      return ingredient;
    });
  };

  const RecipeSection = React.memo(({ title, recipes, icon }) => (
    <div className="recipe-section">
      <h3 className="section-title-netflix">
        {icon} {title}
      </h3>
      <div className="recipe-carousel">
        <div className="carousel-container">
          {recipes.map(recipe => (
            <div 
              key={recipe.id} 
              className="netflix-recipe-card"
              onClick={() => openRecipe(recipe)}
            >
              <div className="netflix-card-image">
                <LazyImage src={recipe.image} alt={recipe.name} />
                {recipe.isWorldRecipe && (
                  <div className="world-badge-netflix">🌍</div>
                )}
                {openRecipes.find(r => r.id === recipe.id) && (
                  <div className="opened-badge-netflix">開いています</div>
                )}
              </div>
              <div className="netflix-card-info">
                <h4>{recipe.name}</h4>
                <div className="netflix-card-meta">
                  <span className="time">{recipe.cookingTime}</span>
                  <span className="difficulty">{recipe.difficulty}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ));

  
  const renderHome = () => (
    <div className="home-content">
      {/* カテゴリータブ */}
      <div className="category-section">
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category}
              className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* アクティブフィルター表示 */}
      {getActiveFilterText() && (
        <div className="active-filters">
          <span className="filter-text">{getActiveFilterText()}</span>
        </div>
      )}
      
      {/* Netflix風カルーセルセクション */}
      {!searchQuery && selectedCategory === 'すべて' && !selectedIngredient && (
        <div className="netflix-sections">
          {sectionRecipes.summer.length > 0 && (
            <RecipeSection 
              title="夏にぴったり" 
              recipes={sectionRecipes.summer} 
              icon="🌞" 
            />
          )}
          
          {sectionRecipes.quick.length > 0 && (
            <RecipeSection 
              title="15分以内で完成" 
              recipes={sectionRecipes.quick} 
              icon="⏰" 
            />
          )}
          
          {sectionRecipes.popular.length > 0 && (
            <RecipeSection 
              title="今週の人気" 
              recipes={sectionRecipes.popular} 
              icon="🔥" 
            />
          )}
          
          {sectionRecipes.withEgg.length > 0 && (
            <RecipeSection 
              title="卵を使った料理" 
              recipes={sectionRecipes.withEgg} 
              icon="🍳" 
            />
          )}
          
          {sectionRecipes.hearty.length > 0 && (
            <RecipeSection 
              title="ボリューム満点" 
              recipes={sectionRecipes.hearty} 
              icon="🥘" 
            />
          )}
          
          {sectionRecipes.healthy.length > 0 && (
            <RecipeSection 
              title="ヘルシー料理" 
              recipes={sectionRecipes.healthy} 
              icon="🥗" 
            />
          )}
        </div>
      )}
      
      {/* レシピ一覧 */}
      <div className="recipes-section">
        {(searchQuery || selectedCategory !== 'すべて' || selectedIngredient) && (
          <h3 className="section-title">
            {filteredRecipes.length}件のレシピが見つかりました
          </h3>
        )}
        
        {filteredRecipes.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>レシピが見つかりませんでした</h3>
            <p>検索条件を変更してみてください</p>
            <button className="clear-filters-btn" onClick={clearFilters}>
              絞り込みをクリア
            </button>
          </div>
        ) : (
          <div className="recipe-grid">
            {filteredRecipes.map(recipe => (
              <div 
                key={recipe.id} 
                className="recipe-card"
                onClick={() => openRecipe(recipe)}
              >
                <div className="recipe-image">
                  <LazyImage src={recipe.image} alt={recipe.name} />
                  {recipe.isWorldRecipe && (
                    <div className="world-recipe-badge">🌍</div>
                  )}
                  {openRecipes.find(r => r.id === recipe.id) && (
                    <div className="opened-badge">開いています</div>
                  )}
                  {memos[recipe.id] && (
                    <div className="memo-badge">📝</div>
                  )}
                  <button 
                    className={`bookmark-btn ${bookmarks.includes(recipe.id) ? 'bookmarked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(recipe.id);
                    }}
                  >
                    ♡
                  </button>
                </div>
                <div className="recipe-info">
                  <h3>{recipe.name}</h3>
                  <p>{recipe.description}</p>
                  <div className="recipe-meta">
                    <span className="time">⏰ {recipe.cookingTime}</span>
                    <span className="difficulty">{recipe.difficulty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* インフィニットスクロール用ローディング表示 */}
      {!searchQuery && selectedCategory === 'すべて' && !selectedIngredient && isLoadingWorldRecipes && (
        <div className="infinite-loading">
          <div className="loading-spinner"></div>
          <p>新しいレシピを読み込み中...</p>
        </div>
      )}
    </div>
  );

  const renderSearch = () => (
    <div className="search-content">
      <div className="search-header">
        <h2>レシピを検索</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="料理名、材料で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      <div className="recipe-grid">
        {filteredRecipes.map(recipe => (
          <div 
            key={recipe.id} 
            className="recipe-card"
            onClick={() => openRecipe(recipe)}
          >
            <div className="recipe-image">
              <LazyImage src={recipe.image} alt={recipe.name} />
              {openRecipes.find(r => r.id === recipe.id) && (
                <div className="opened-badge">開いています</div>
              )}
              {memos[recipe.id] && (
                <div className="memo-badge">📝</div>
              )}
            </div>
            <div className="recipe-info">
              <h3>{recipe.name}</h3>
              <p>{recipe.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBookmarks = () => (
    <div className="bookmarks-content">
      <h2>お気に入り</h2>
      {bookmarkedRecipes.length === 0 ? (
        <div className="empty-bookmarks">
          <p>まだお気に入りのレシピがありません</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {bookmarkedRecipes.map(recipe => (
            <div 
              key={recipe.id} 
              className="recipe-card"
              onClick={() => openRecipe(recipe)}
            >
              <div className="recipe-image">
                <LazyImage src={recipe.image} alt={recipe.name} />
                {openRecipes.find(r => r.id === recipe.id) && (
                  <div className="opened-badge">開いています</div>
                )}
                {memos[recipe.id] && (
                  <div className="memo-badge">📝</div>
                )}
              </div>
              <div className="recipe-info">
                <h3>{recipe.name}</h3>
                <p>{recipe.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderShoppingList = () => {
    // Group items by category
    const groupedItems = {};
    shoppingList.forEach(item => {
      if (!groupedItems[item.category]) {
        groupedItems[item.category] = [];
      }
      groupedItems[item.category].push(item);
    });
    
    // Sort items within each category - unchecked first
    Object.keys(groupedItems).forEach(category => {
      groupedItems[category].sort((a, b) => {
        if (a.checked === b.checked) return 0;
        return a.checked ? 1 : -1;
      });
    });
    
    const allChecked = shoppingList.length > 0 && shoppingList.every(item => item.checked);
    const someChecked = shoppingList.some(item => item.checked);
    
    return (
      <div className="shopping-list-content">
        <div className="shopping-list-header">
          <h2>買い物リスト</h2>
          <div className="shopping-list-actions">
            <button 
              className="action-btn"
              onClick={() => toggleAllShoppingItems(!allChecked)}
              disabled={shoppingList.length === 0}
              title={allChecked ? '全て解除' : '全て選択'}
            >
              {allChecked ? '解除' : '選択'}
            </button>
            <button 
              className="action-btn share-btn"
              onClick={shareShoppingList}
              disabled={shoppingList.length === 0}
              title="リストを共有"
            >
              共有
            </button>
            <button 
              className="action-btn clear-btn"
              onClick={clearShoppingList}
              onContextMenu={(e) => {
                e.preventDefault();
                if (shoppingList.length > 0) {
                  clearAllShoppingList();
                }
              }}
              disabled={shoppingList.filter(item => item.checked).length === 0}
              title="チェック済みを削除（長押しで全削除）"
            >
              削除
            </button>
          </div>
        </div>
        
        {shoppingList.length === 0 ? (
          <div className="empty-shopping-list">
            <p>買い物リストは空です</p>
            <p className="hint">レシピから材料を追加してください</p>
          </div>
        ) : (
          <div className="shopping-categories">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="shopping-category">
                <h3 className="category-header">{category}</h3>
                <div className="shopping-items">
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      className={`shopping-item ${item.checked ? 'checked' : ''}`}
                    >
                      <label className="item-checkbox">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleShoppingItem(item.id)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      <div className="item-details">
                        <span className="item-name">{item.name}</span>
                        {editingShoppingItem === item.id ? (
                          <input
                            type="text"
                            className="quantity-edit"
                            value={item.quantity}
                            onChange={(e) => updateShoppingItemQuantity(item.id, e.target.value)}
                            onBlur={() => setEditingShoppingItem(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setEditingShoppingItem(null);
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span 
                            className="item-quantity"
                            onClick={() => setEditingShoppingItem(item.id)}
                          >
                            {item.quantity}
                          </span>
                        )}
                        {item.recipeName && (
                          <span className="item-source">({item.recipeName})</span>
                        )}
                      </div>
                      {!item.checked && (
                        <button
                          className="delete-btn"
                          onClick={() => deleteShoppingItem(item.id)}
                          title="削除"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="add-item-section">
          {!showAddForm ? (
            <button 
              className="add-item-btn"
              onClick={() => setShowAddForm(true)}
            >
              + 材料を追加
            </button>
          ) : (
            <div className="add-item-form">
              <input
                type="text"
                placeholder="材料名"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="add-item-input"
              />
              <input
                type="text"
                placeholder="数量"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                className="add-item-input quantity"
              />
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="category-select"
              >
                <option value="肉類">肉類</option>
                <option value="野菜">野菜</option>
                <option value="調味料">調味料</option>
                <option value="その他">その他</option>
              </select>
              <button
                className="confirm-add-btn"
                onClick={() => {
                  if (newItemName.trim()) {
                    addCustomShoppingItem(newItemName, newItemQuantity, newItemCategory);
                    setNewItemName('');
                    setNewItemQuantity('');
                    setNewItemCategory('その他');
                    setShowAddForm(false);
                  }
                }}
              >
                追加
              </button>
              <button
                className="cancel-add-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setNewItemName('');
                  setNewItemQuantity('');
                  setNewItemCategory('その他');
                }}
              >
                キャンセル
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTabBar = () => {
    if (openRecipes.length === 0) return null;
    
    return (
      <div className="tab-bar">
        <button 
          className="back-to-list-btn"
          onClick={() => {
            setShowRecipeList(true);
          }}
        >
          ← 一覧
        </button>
        <div className="tabs-container">
          {openRecipes.map((recipe, index) => (
            <div 
              key={recipe.id}
              className={`recipe-tab ${index === activeRecipeIndex ? 'active' : ''}`}
              onClick={() => switchToRecipe(index)}
            >
              <span className="tab-title">{recipe.name}</span>
              <button 
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeRecipe(index);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button 
          className="close-all-btn"
          onClick={() => {
            setOpenRecipes([]);
            setShowRecipeList(true);
          }}
        >
          すべて閉じる
        </button>
      </div>
    );
  };

  if (openRecipes.length > 0 && !showRecipeList) {
    const selectedRecipe = getCurrentRecipe();
    if (!selectedRecipe) return null;

    return (
      <div className="App mobile-app">
        <div className="recipe-detail-fullscreen">
          {renderTabBar()}
          
          {/* 料理写真とヘッダー情報 */}
          <div className="recipe-hero-new">
            <div className="recipe-image-container">
              <LazyImage src={selectedRecipe.image} alt={selectedRecipe.name} />
              <div className="recipe-overlay">
                <button 
                  className={`bookmark-fab ${bookmarks.includes(selectedRecipe.id) ? 'bookmarked' : ''}`}
                  onClick={() => toggleBookmark(selectedRecipe.id)}
                >
                  ♡
                </button>
                <div className="recipe-title-overlay">
                  <h1>{selectedRecipe.name}</h1>
                  <div className="recipe-meta">
                    <span className="time">⏰ {selectedRecipe.cookingTime}</span>
                    <span className="difficulty">{selectedRecipe.difficulty}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 人数選択 */}
          <div className="servings-section-new">
            <div className="servings-selector-new">
              <span className="servings-label">人数を選択</span>
              <div className="servings-buttons-new">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    className={`serving-btn-new ${(selectedServings[selectedRecipe.id] || selectedRecipe.servings) === num ? 'active' : ''}`}
                    onClick={() => setSelectedServings(prev => ({
                      ...prev,
                      [selectedRecipe.id]: num
                    }))}
                  >
                    {num}人
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 調理モードプログレス */}
          {cookingMode && (
            <div className="cooking-progress-new">
              <div className="progress-info">
                <span>ステップ {currentStep + 1} / {selectedRecipe.instructions.length}</span>
                <div className="step-controls">
                  <button 
                    className="step-btn prev" 
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    ← 前
                  </button>
                  <button 
                    className="step-btn next" 
                    onClick={nextStep}
                    disabled={currentStep === selectedRecipe.instructions.length - 1}
                  >
                    次 →
                  </button>
                </div>
              </div>
              <div className="progress-line">
                <div 
                  className="progress-fill" 
                  style={{width: `${((currentStep + 1) / selectedRecipe.instructions.length) * 100}%`}}
                ></div>
              </div>
            </div>
          )}

          {/* タブナビゲーション */}
          <div className="recipe-tabs">
            <button
              className={`tab-btn ${activeRecipeTab === 'recipe' ? 'active' : ''}`}
              onClick={() => setActiveRecipeTab('recipe')}
            >
              レシピ
            </button>
            <button
              className={`tab-btn ${activeRecipeTab === 'nutrition' ? 'active' : ''}`}
              onClick={() => setActiveRecipeTab('nutrition')}
            >
              栄養価
            </button>
            <button
              className={`tab-btn ${activeRecipeTab === 'advice' ? 'active' : ''}`}
              onClick={() => setActiveRecipeTab('advice')}
            >
              アドバイス
            </button>
          </div>

          {/* タブコンテンツ */}
          <div className="tab-content">
            {activeRecipeTab === 'recipe' && (
              <div className="recipe-tab-content">
                {/* 材料セクション */}
                <div className="ingredients-section-new">
                  <div className="section-header">
                    <h3>🥬 材料</h3>
                    <div className="ingredients-actions">
                      <span className="progress-text">
                        {getCheckedCount(selectedRecipe.id, selectedRecipe.ingredients.length)}/
                        {selectedRecipe.ingredients.length}
                      </span>
                      <button 
                        className="add-to-shopping-btn-small"
                        onClick={() => addToShoppingList(selectedRecipe)}
                        title="買い物リストに追加"
                      >
                        🛒
                      </button>
                    </div>
                  </div>
                  
                  <div className="ingredients-controls-new">
                    <button 
                      className="control-btn-small"
                      onClick={() => toggleAllIngredients(selectedRecipe.id, selectedRecipe.ingredients.length, true)}
                    >
                      全選択
                    </button>
                    <button 
                      className="control-btn-small"
                      onClick={() => toggleAllIngredients(selectedRecipe.id, selectedRecipe.ingredients.length, false)}
                    >
                      全解除
                    </button>
                  </div>
                  
                  <ul className="ingredients-list-new">
                    {getAdjustedIngredients(selectedRecipe).map((ingredient, index) => {
                      const key = `${selectedRecipe.id}-${index}`;
                      const isChecked = checkedIngredients[key] || false;
                      return (
                        <li key={index} className="ingredient-item-new">
                          <label className="ingredient-label-new">
                            <input
                              type="checkbox"
                              className="ingredient-checkbox-new"
                              checked={isChecked}
                              onChange={() => toggleIngredient(selectedRecipe.id, index)}
                            />
                            <span className="custom-checkbox-new"></span>
                            <span className={`ingredient-text-new ${isChecked ? 'checked' : ''}`}>
                              {ingredient}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* 賢い食材使い切りアコーディオン */}
                <div className="smart-ingredients-accordion">
                  <button 
                    className={`accordion-header ${isSmartIngredientsExpanded ? 'expanded' : ''}`}
                    onClick={() => setIsSmartIngredientsExpanded(!isSmartIngredientsExpanded)}
                  >
                    <div className="accordion-header-content">
                      <span className="accordion-title">🧅 賢い食材使い切り</span>
                      {selectedIngredientsCount > 0 && (
                        <span className="selection-count">{selectedIngredientsCount}件選択中</span>
                      )}
                    </div>
                    <span className={`accordion-arrow ${isSmartIngredientsExpanded ? 'expanded' : ''}`}>
                      ▼
                    </span>
                  </button>
                  
                  <div className={`accordion-content ${isSmartIngredientsExpanded ? 'expanded' : ''}`}>
                    <div className="accordion-body">
                      <IngredientOptimizer
                        recipe={selectedRecipe}
                        ingredients={getDisplayIngredients(selectedRecipe)}
                        onOptimizedIngredientsUpdate={(newIngredients) => 
                          handleOptimizedIngredientsUpdate(selectedRecipe.id, newIngredients)
                        }
                        onSelectionCountChange={setSelectedIngredientsCount}
                      />
                    </div>
                  </div>
                </div>

                {/* 作り方セクション */}
                <div className="instructions-section-new">
                  <h3>👩‍🍳 作り方</h3>
                  <ol className="instructions-list-new">
                    {selectedRecipe.instructions.map((step, index) => {
                      const time = extractTimeFromStep(step);
                      const timerId = `${selectedRecipe.id}-${index}`;
                      const timer = timers[timerId];
                      
                      return (
                        <li key={index} className="instruction-step-new">
                          <div className="step-content">
                            <span className="step-text-new">{step}</span>
                            {time && (
                              <div className="timer-container-new">
                                {!timer ? (
                                  <button
                                    className="timer-btn-new start"
                                    onClick={() => startTimer(selectedRecipe.id, index, time)}
                                  >
                                    ⏱️ {Math.floor(time / 60)}分
                                  </button>
                                ) : timer.isCompleted ? (
                                  <button
                                    className="timer-btn-new completed"
                                    onClick={() => stopTimer(selectedRecipe.id, index)}
                                  >
                                    ✅ 完了
                                  </button>
                                ) : (
                                  <div className="timer-active-new">
                                    <span className={`timer-display-new ${timer.remaining <= 10 ? 'warning' : ''}`}>
                                      {formatTime(timer.remaining)}
                                    </span>
                                    <div className="timer-controls">
                                      {timer.isPaused ? (
                                        <button
                                          className="timer-control-btn resume"
                                          onClick={() => resumeTimer(selectedRecipe.id, index)}
                                        >
                                          ▶️
                                        </button>
                                      ) : (
                                        <button
                                          className="timer-control-btn pause"
                                          onClick={() => pauseTimer(selectedRecipe.id, index)}
                                        >
                                          ⏸️
                                        </button>
                                      )}
                                      <button
                                        className="timer-control-btn stop"
                                        onClick={() => stopTimer(selectedRecipe.id, index)}
                                      >
                                        ⏹️
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            )}

            {activeRecipeTab === 'nutrition' && (
              <div className="nutrition-tab-content">
                {(() => {
                  const nutrition = calculateNutrition(selectedRecipe, selectedServings[selectedRecipe.id] || selectedRecipe.servings);
                  const badges = getNutritionBadges(nutrition);
                  
                  return (
                    <div className="nutrition-content-new">
                      {/* 栄養価バッジ */}
                      {badges.length > 0 && (
                        <div className="nutrition-badges-new">
                          {badges.map((badge, index) => (
                            <span
                              key={index}
                              className="nutrition-badge-new"
                              style={{ backgroundColor: badge.color }}
                            >
                              {badge.text}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* 栄養価詳細 */}
                      <div className="nutrition-grid-new">
                        <div className="nutrition-item-new calories">
                          <div className="nutrition-header-new">
                            <span className="nutrition-icon-new">🔥</span>
                            <span className="nutrition-label-new">カロリー</span>
                          </div>
                          <div className="nutrition-value-new">{nutrition.calories} kcal</div>
                          <div className="nutrition-bar-new">
                            <div 
                              className="nutrition-progress-new calories-progress"
                              style={{width: `${Math.min((nutrition.calories / dailyRecommendedIntake.calories) * 100, 100)}%`}}
                            ></div>
                          </div>
                          <div className="nutrition-percentage-new">
                            {Math.round((nutrition.calories / dailyRecommendedIntake.calories) * 100)}%
                          </div>
                        </div>
                        
                        <div className="nutrition-item-new protein">
                          <div className="nutrition-header-new">
                            <span className="nutrition-icon-new">💪</span>
                            <span className="nutrition-label-new">タンパク質</span>
                          </div>
                          <div className="nutrition-value-new">{nutrition.protein} g</div>
                          <div className="nutrition-bar-new">
                            <div 
                              className="nutrition-progress-new protein-progress"
                              style={{width: `${Math.min((nutrition.protein / dailyRecommendedIntake.protein) * 100, 100)}%`}}
                            ></div>
                          </div>
                          <div className="nutrition-percentage-new">
                            {Math.round((nutrition.protein / dailyRecommendedIntake.protein) * 100)}%
                          </div>
                        </div>
                        
                        <div className="nutrition-item-new fat">
                          <div className="nutrition-header-new">
                            <span className="nutrition-icon-new">🥑</span>
                            <span className="nutrition-label-new">脂質</span>
                          </div>
                          <div className="nutrition-value-new">{nutrition.fat} g</div>
                          <div className="nutrition-bar-new">
                            <div 
                              className="nutrition-progress-new fat-progress"
                              style={{width: `${Math.min((nutrition.fat / dailyRecommendedIntake.fat) * 100, 100)}%`}}
                            ></div>
                          </div>
                          <div className="nutrition-percentage-new">
                            {Math.round((nutrition.fat / dailyRecommendedIntake.fat) * 100)}%
                          </div>
                        </div>
                        
                        <div className="nutrition-item-new carbs">
                          <div className="nutrition-header-new">
                            <span className="nutrition-icon-new">🍞</span>
                            <span className="nutrition-label-new">炭水化物</span>
                          </div>
                          <div className="nutrition-value-new">{nutrition.carbs} g</div>
                          <div className="nutrition-bar-new">
                            <div 
                              className="nutrition-progress-new carbs-progress"
                              style={{width: `${Math.min((nutrition.carbs / dailyRecommendedIntake.carbs) * 100, 100)}%`}}
                            ></div>
                          </div>
                          <div className="nutrition-percentage-new">
                            {Math.round((nutrition.carbs / dailyRecommendedIntake.carbs) * 100)}%
                          </div>
                        </div>
                        
                        <div className="nutrition-item-new fiber">
                          <div className="nutrition-header-new">
                            <span className="nutrition-icon-new">🌾</span>
                            <span className="nutrition-label-new">食物繊維</span>
                          </div>
                          <div className="nutrition-value-new">{nutrition.fiber} g</div>
                          <div className="nutrition-bar-new">
                            <div 
                              className="nutrition-progress-new fiber-progress"
                              style={{width: `${Math.min((nutrition.fiber / dailyRecommendedIntake.fiber) * 100, 100)}%`}}
                            ></div>
                          </div>
                          <div className="nutrition-percentage-new">
                            {Math.round((nutrition.fiber / dailyRecommendedIntake.fiber) * 100)}%
                          </div>
                        </div>
                        
                        <div className="nutrition-item-new salt">
                          <div className="nutrition-header-new">
                            <span className="nutrition-icon-new">🧂</span>
                            <span className="nutrition-label-new">塩分相当量</span>
                          </div>
                          <div className="nutrition-value-new">{nutrition.salt} g</div>
                          <div className="nutrition-bar-new">
                            <div 
                              className="nutrition-progress-new salt-progress"
                              style={{width: `${Math.min((nutrition.salt / dailyRecommendedIntake.salt) * 100, 100)}%`}}
                            ></div>
                          </div>
                          <div className="nutrition-percentage-new">
                            {Math.round((nutrition.salt / dailyRecommendedIntake.salt) * 100)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="nutrition-note-new">
                        <small>※ 推奨摂取量は成人の1日分を基準としています</small>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeRecipeTab === 'advice' && (
              <div className="advice-tab-content">
                {/* 料理のコツセクション */}
                {selectedRecipe.tips && selectedRecipe.tips.length > 0 && (
                  <div className="tips-section-new">
                    <h3>💡 料理のコツ</h3>
                    <ul className="tips-list-new">
                      {selectedRecipe.tips.map((tip, index) => (
                        <li key={index} className="tip-item-new">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 副菜提案セクション */}
                {selectedRecipe.sideDishes && selectedRecipe.sideDishes.length > 0 && (
                  <div className="side-dishes-section-new">
                    <h3>🍱 おすすめの副菜</h3>
                    <div className="side-dishes-list-new">
                      {selectedRecipe.sideDishes.map((sideDish, index) => {
                        const matchingRecipe = allRecipes.find(recipe => 
                          recipe.name.includes(sideDish) || sideDish.includes(recipe.name)
                        );
                        
                        return (
                          <div key={index} className="side-dish-item-new">
                            {matchingRecipe ? (
                              <button 
                                className="side-dish-link-new"
                                onClick={() => openRecipe(matchingRecipe)}
                              >
                                {sideDish}
                                <span className="link-icon-new">→</span>
                              </button>
                            ) : (
                              <span className="side-dish-text-new">{sideDish}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* メモセクション */}
                <div className="memo-section-new">
                  <div className="memo-header-new">
                    <h3>📝 メモ</h3>
                    {memos[selectedRecipe.id] && (
                      <button 
                        className="clear-memo-btn-new"
                        onClick={() => {
                          if (window.confirm('メモを削除しますか？')) {
                            clearMemo(selectedRecipe.id);
                          }
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <div className="memo-container-new">
                    <textarea
                      className="memo-textarea-new"
                      placeholder="このレシピのメモを入力...（例：次は塩少なめ）"
                      value={memos[selectedRecipe.id] || ''}
                      onChange={(e) => {
                        const text = e.target.value;
                        if (text.length <= 200) {
                          updateMemo(selectedRecipe.id, text);
                        }
                      }}
                      maxLength={200}
                      rows={4}
                    />
                    <div className="memo-counter-new">
                      {(memos[selectedRecipe.id] || '').length}/200
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* フローティングアクションボタン */}
          <div className="floating-actions">
            <button 
              className={`fab cooking-fab ${cookingMode ? 'active' : ''}`}
              onClick={toggleCookingMode}
              title={cookingMode ? '調理モード終了' : '調理モード開始'}
            >
              {cookingMode ? '👨‍🍳' : '🔥'}
            </button>
          </div>
        </div>
        
        {notification && (
          <div className="notification-toast">
            {notification}
          </div>
        )}
        
      </div>
    );
  }

  const renderFloatingTabBar = () => {
    if (openRecipes.length === 0 || !showRecipeList) return null;
    
    return (
      <div className="floating-tab-bar">
        <div className="floating-tabs">
          {openRecipes.map((recipe, index) => (
            <button
              key={recipe.id}
              className={`floating-tab ${index === activeRecipeIndex ? 'active' : ''}`}
              onClick={() => {
                setActiveRecipeIndex(index);
                setShowRecipeList(false);
              }}
            >
              {recipe.name}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderWeeklyMenu = () => {
    const getDayName = (date) => {
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      return days[date.getDay()];
    };

    const formatDate = (date) => {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    const getWeekDates = () => {
      if (!currentWeekStart) {
        // If no week start is set, use current week
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        return Array.from({length: 7}, (_, i) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);
          return date;
        });
      }
      
      const dates = [];
      const weekStartDate = new Date(currentWeekStart);
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStartDate);
        date.setDate(weekStartDate.getDate() + i);
        dates.push(date);
      }
      return dates;
    };

    const weekDates = getWeekDates();

    return (
      <div className="weekly-menu-content">
        <div className="weekly-menu-header">
          <h2>今週の献立</h2>
          <div className="weekly-menu-actions">
            <button 
              className="generate-menu-btn"
              onClick={generateWeeklyMenu}
            >
              献立生成
            </button>
            {weeklyMenu.length > 0 && (
              <button 
                className="generate-shopping-btn"
                onClick={() => {
                  try {
                    const weeklyShoppingList = generateWeeklyShoppingList();
                    if (weeklyShoppingList && weeklyShoppingList.length > 0) {
                      setShoppingList(prev => [...prev, ...weeklyShoppingList]);
                      setActiveTab('shopping');
                      setNotification(`献立から買い物リスト（${weeklyShoppingList.length}件）を追加しました！`);
                    } else {
                      setNotification('買い物リストに追加する材料がありませんでした。');
                    }
                    setTimeout(() => setNotification(''), 3000);
                  } catch (error) {
                    console.error('Error handling shopping list button:', error);
                    setNotification('買い物リストの生成でエラーが発生しました。');
                    setTimeout(() => setNotification(''), 3000);
                  }
                }}
              >
                買い物リスト
              </button>
            )}
          </div>
        </div>

        {weeklyMenu.length === 0 ? (
          <div className="empty-menu">
            <div className="empty-menu-icon">📅</div>
            <p>「献立生成」ボタンを押して<br />1週間分の献立を自動作成しましょう</p>
          </div>
        ) : (
          <div className="weekly-calendar">
            {weekDates.map((date, index) => {
              const recipe = weeklyMenu[index];
              return (
                <div key={index} className="day-card">
                  <div className="day-header">
                    <div className="day-info">
                      <span className="day-name">{getDayName(date)}</span>
                      <span className="day-date">{formatDate(date)}</span>
                    </div>
                    <div className="day-header-actions">
                      <button 
                        className="header-btn"
                        onClick={() => {
                          // 他のレシピをランダムに選択
                          const newRecipe = allRecipes[Math.floor(Math.random() * allRecipes.length)];
                          const newMenu = [...weeklyMenu];
                          newMenu[index] = newRecipe;
                          setWeeklyMenu(newMenu);
                          localStorage.setItem('weeklyMenu', JSON.stringify(newMenu));
                        }}
                      >
                        変更
                      </button>
                      <button 
                        className="header-btn"
                        onClick={() => {
                          const newMenu = [...weeklyMenu];
                          newMenu[index] = null;
                          setWeeklyMenu(newMenu);
                          localStorage.setItem('weeklyMenu', JSON.stringify(newMenu));
                        }}
                      >
                        スキップ
                      </button>
                    </div>
                  </div>
                  
                  {recipe ? (
                    <div className="recipe-card-mini" onClick={() => openRecipe(recipe)}>
                      <div className="recipe-image-mini">
                        <img 
                          src={recipe.strMealThumb || recipe.image || 'https://via.placeholder.com/150x100?text=No+Image'} 
                          alt={recipe.strMeal || recipe.name}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150x100?text=No+Image';
                          }}
                        />
                      </div>
                      <div className="recipe-info-mini">
                        <h4 className="recipe-title-mini">{recipe.strMeal || recipe.name}</h4>
                        <p className="recipe-area-mini">{recipe.strArea || recipe.category}</p>
                        <div className="recipe-stats-mini">
                          {recipe.nutrition && (
                            <span className="calories-mini">
                              {Math.round(recipe.nutrition.calories)}kcal
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-day">
                      <span>レシピなし</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="App mobile-app">
      <header className="app-header">
        <h1>🍳 レシピアプリ</h1>
        {(showInstallPrompt || process.env.NODE_ENV === 'development') && (
          <button 
            className="install-button"
            onClick={handleInstallApp}
            title="ホーム画面に追加"
          >
            📱 {showInstallPrompt ? 'アプリをインストール' : 'インストール(デバッグ)'}
          </button>
        )}
      </header>
      
      <main className="app-main">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'search' && renderSearch()}
        {activeTab === 'bookmarks' && renderBookmarks()}
        {activeTab === 'shopping' && renderShoppingList()}
        {activeTab === 'weekly' && renderWeeklyMenu()}
        {renderFloatingTabBar()}
      </main>
      
      <nav className="bottom-nav">
        <button 
          className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">ホーム</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <span className="nav-icon">🔍</span>
          <span className="nav-label">検索</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          <span className="nav-icon">♡</span>
          <span className="nav-label">お気に入り</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'shopping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopping')}
        >
          <span className="nav-icon">🛒</span>
          <span className="nav-label">買い物</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          <span className="nav-icon">📅</span>
          <span className="nav-label">献立</span>
        </button>
      </nav>
      
      {notification && (
        <div className="notification-toast">
          {notification}
        </div>
      )}
    </div>
  );
}

export default App;
