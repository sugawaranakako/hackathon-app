import React, { useState, useEffect } from 'react';
import './App.css';
import { recipesData } from './data/recipes';

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
  const [cookingMode, setCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('checkedIngredients');
    if (saved) {
      setCheckedIngredients(JSON.parse(saved));
    }
    
    const savedMemos = localStorage.getItem('recipeMemos');
    if (savedMemos) {
      setMemos(JSON.parse(savedMemos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('checkedIngredients', JSON.stringify(checkedIngredients));
  }, [checkedIngredients]);

  useEffect(() => {
    localStorage.setItem('recipeMemos', JSON.stringify(memos));
  }, [memos]);
  
  // 初回マウント時に世界のレシピを取得
  useEffect(() => {
    const loadInitialWorldRecipes = async () => {
      if (hasLoadedInitialRecipes) return;
      
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
            
            const instructions = meal.strInstructions
              .split('\n')
              .filter(step => step.trim())
              .map((step, i) => {
                let translatedStep = step.trim();
                const cookingTerms = {
                  'heat': '加熱', 'cook': '調理', 'boil': '茹でる', 'fry': '炒める', 'stir fry': '炒める',
                  'bake': '焼く', 'grill': 'グリルする', 'roast': 'ロースト', 'simmer': '煮込む', 'steam': '蒸す',
                  'mix': '混ぜる', 'stir': 'かき混ぜる', 'add': '加える', 'pour': '注ぐ', 'drain': '水を切る',
                  'chop': '刻む', 'dice': 'さいの目切り', 'slice': 'スライス', 'season': '味付け', 'serve': '盛り付ける',
                  'minutes': '分', 'hours': '時間', 'until golden': 'きつね色になるまで', 'until tender': '柔らかくなるまで'
                };
                
                Object.entries(cookingTerms).forEach(([en, jp]) => {
                  const regex = new RegExp(en, 'gi');
                  translatedStep = translatedStep.replace(regex, jp);
                });
                
                translatedStep = translateIngredient(translatedStep);
                return `${i + 1}. ${translatedStep}`;
              });
            
            return {
              id: `world-${meal.idMeal}`,
              name: translateMealName(meal.strMeal),
              description: `${translateArea(meal.strArea)}料理 - ${translateCategory(meal.strCategory)}`,
              image: meal.strMealThumb,
              cookingTime: '30分',
              difficulty: '普通',
              servings: 2,
              ingredients: ingredients,
              instructions: instructions,
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
  
  const loadMoreWorldRecipes = async () => {
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
          
          const instructions = meal.strInstructions
            .split('\n')
            .filter(step => step.trim())
            .map((step, i) => {
              let translatedStep = step.trim();
              const cookingTerms = {
                'heat': '加熱', 'cook': '調理', 'boil': '茹でる', 'fry': '炒める', 'stir fry': '炒める',
                'bake': '焼く', 'grill': 'グリルする', 'roast': 'ローストロースト', 'simmer': '煮込む', 'steam': '蒸す',
                'mix': '混ぜる', 'stir': 'かき混ぜる', 'add': '加える', 'pour': '注ぐ', 'drain': '水を切る',
                'chop': '刻む', 'dice': 'さいの目切り', 'slice': 'スライス', 'season': '味付け', 'serve': '盛り付ける',
                'minutes': '分', 'hours': '時間', 'until golden': 'きつね色になるまで', 'until tender': '柔らかくなるまで'
              };
              
              Object.entries(cookingTerms).forEach(([en, jp]) => {
                const regex = new RegExp(en, 'gi');
                translatedStep = translatedStep.replace(regex, jp);
              });
              
              translatedStep = translateIngredient(translatedStep);
              return `${i + 1}. ${translatedStep}`;
            });
          
          return {
            id: `world-${meal.idMeal}-${Date.now()}-${Math.random()}`, // 重複防止
            name: translateMealName(meal.strMeal),
            description: `${translateArea(meal.strArea)}料理 - ${translateCategory(meal.strCategory)}`,
            image: meal.strMealThumb,
            cookingTime: '30分',
            difficulty: '普通',
            servings: 2,
            ingredients: ingredients,
            instructions: instructions,
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
  };

  const allRecipes = [...recipesData, ...worldRecipes];
  
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
  
  const filteredRecipes = allRecipes.filter(recipe => {
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
  
  // セクション別にレシピを振り分け
  const getSectionRecipes = () => {
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
  };
  
  const sectionRecipes = getSectionRecipes();
  
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

  
  const translateMeasure = (measure) => {
    if (!measure) return '';
    
    const measurements = {
      // 体積
      'cup': 'カップ',
      'cups': 'カップ',
      'tablespoon': '大さじ',
      'tablespoons': '大さじ',
      'tbsp': '大さじ',
      'teaspoon': '小さじ',
      'teaspoons': '小さじ',
      'tsp': '小さじ',
      'ml': 'ml',
      'liter': 'リットル',
      'liters': 'リットル',
      // 重量
      'g': 'g',
      'kg': 'kg',
      'gram': 'g',
      'grams': 'g',
      'kilogram': 'kg',
      'kilograms': 'kg',
      'oz': 'オンス',
      'ounce': 'オンス',
      'ounces': 'オンス',
      'lb': 'ポンド',
      'pound': 'ポンド',
      'pounds': 'ポンド',
      // その他
      'piece': '個',
      'pieces': '個',
      'slice': '枚',
      'slices': '枚',
      'clove': '片',
      'cloves': '片',
      'bunch': '束',
      'handful': 'ひとつかみ',
      'pinch': 'ひとつまみ',
      'dash': '少々',
      'to taste': '適量',
      'small': '小',
      'medium': '中',
      'large': '大',
      // 追加の単位
      'dozen': 'ダース',
      'half': '半分',
      'quarter': '1/4',
      'third': '1/3',
      'whole': '丸ごと',
      'can': '缶',
      'jar': '瓶',
      'package': 'パック',
      'packet': '袋',
      'bag': '袋',
      'bottle': '本',
      'box': '箱',
      'tin': '缶',
      'fresh': '新鮮な',
      'dried': '乾燥',
      'frozen': '冷凍',
      'chopped': '刻んだ',
      'diced': 'さいの目切りの',
      'sliced': 'スライスした',
      'minced': 'みじん切りの',
      'ground': '挽き肉',
      'crushed': '砂く',
      'grated': 'すりおろした',
      'shredded': '細切り',
      'optional': 'お好みで'
    };
    
    let translated = measure.toLowerCase();
    Object.entries(measurements).forEach(([en, jp]) => {
      const regex = new RegExp(`\\b${en}\\b`, 'gi');
      translated = translated.replace(regex, jp);
    });
    
    return translated;
  };
  
  const translateIngredient = (ingredient) => {
    const translations = {
      // 肉類
      'chicken': 'チキン',
      'beef': 'ビーフ',
      'pork': 'ポーク',
      'lamb': 'ラム',
      'fish': '魚',
      'salmon': 'サーモン',
      'tuna': 'ツナ',
      'shrimp': 'エビ',
      'prawns': 'エビ',
      // 野菜
      'onion': '玉ねぎ',
      'onions': '玉ねぎ',
      'garlic': 'ニンニク',
      'tomato': 'トマト',
      'tomatoes': 'トマト',
      'potato': 'じゃがいも',
      'potatoes': 'じゃがいも',
      'carrot': '人参',
      'carrots': '人参',
      'celery': 'セロリ',
      'lettuce': 'レタス',
      'cabbage': 'キャベツ',
      'spinach': 'ほうれん草',
      'broccoli': 'ブロッコリー',
      'cauliflower': 'カリフラワー',
      'corn': 'コーン',
      'peas': 'グリーンピース',
      'bell pepper': 'パプリカ',
      'green pepper': 'ピーマン',
      'red pepper': '赤パプリカ',
      'cucumber': 'きゅうり',
      'mushroom': 'キノコ',
      'mushrooms': 'キノコ',
      // 調味料・香辛料
      'salt': '塩',
      'pepper': 'コショウ',
      'black pepper': '黒コショウ',
      'chili': 'チリ',
      'paprika': 'パプリカパウダー',
      'cumin': 'クミン',
      'coriander': 'コリアンダー',
      'turmeric': 'ターメリック',
      'curry powder': 'カレー粉',
      'ginger': '生姜',
      'soy sauce': '醤油',
      'vinegar': '酢',
      'honey': 'はちみつ',
      'mustard': 'マスタード',
      'ketchup': 'ケチャップ',
      'mayonnaise': 'マヨネーズ',
      'worcestershire sauce': 'ウスターソース',
      // 乳製品
      'milk': '牛乳',
      'cream': 'クリーム',
      'heavy cream': '生クリーム',
      'sour cream': 'サワークリーム',
      'yogurt': 'ヨーグルト',
      'cheese': 'チーズ',
      'cheddar': 'チェダーチーズ',
      'mozzarella': 'モッツァレラ',
      'parmesan': 'パルメザン',
      'butter': 'バター',
      // 穀物・粉類
      'rice': '米',
      'flour': '小麦粉',
      'bread': 'パン',
      'pasta': 'パスタ',
      'noodles': '麺',
      'breadcrumbs': 'パン粉',
      // その他の食材
      'egg': '卵',
      'eggs': '卵',
      'oil': '油',
      'olive oil': 'オリーブオイル',
      'vegetable oil': 'サラダ油',
      'sugar': '砂糖',
      'brown sugar': 'ブラウンシュガー',
      'water': '水',
      'stock': 'スープストック',
      'chicken stock': 'チキンスープ',
      'beef stock': 'ビーフスープ',
      'lemon': 'レモン',
      'lime': 'ライム',
      'orange': 'オレンジ',
      'coconut milk': 'ココナッツミルク',
      'beans': '豆',
      'basil': 'バジル',
      'parsley': 'パセリ',
      'thyme': 'タイム',
      'oregano': 'オレガノ',
      'bay leaves': 'ローリエ',
      'rosemary': 'ローズマリー',
      // 追加の野菜
      'leek': 'ネギ',
      'spring onion': 'ネギ',
      'scallion': 'ネギ',
      'ginger root': '生姜',
      'zucchini': 'ズッキーニ',
      'eggplant': 'ナス',
      'aubergine': 'ナス',
      'sweet potato': 'さつまいも',
      'pumpkin': 'かぼちゃ',
      'radish': '大根',
      'turnip': 'カブ',
      'beet': 'ビーツ',
      'asparagus': 'アスパラガス',
      'green beans': 'さやいんげん',
      'okra': 'オクラ',
      // 果物
      'apple': 'りんご',
      'banana': 'バナナ',
      'strawberry': 'いちご',
      'blueberry': 'ブルーベリー',
      'raspberry': 'ラズベリー',
      'pineapple': 'パイナップル',
      'mango': 'マンゴー',
      'avocado': 'アボカド',
      'grape': 'ぶどう',
      'cherry': 'さくらんぼ',
      'peach': '桃',
      'pear': '洋なし',
      // ナッツ・種
      'almond': 'アーモンド',
      'walnut': 'くるみ',
      'cashew': 'カシューナッツ',
      'peanut': 'ピーナッツ',
      'sesame': 'ゴマ',
      'sesame seeds': 'ゴマ',
      'sunflower seeds': 'ひまわりの種',
      // 豆類
      'lentils': 'レンズ豆',
      'chickpeas': 'ひよこ豆',
      'kidney beans': 'キドニービーンズ',
      'black beans': '黒豆',
      'green beans': 'いんげん',
      'soy beans': '大豆',
      'tofu': '豆腐',
      // ソース・ペースト
      'tomato sauce': 'トマトソース',
      'tomato paste': 'トマトペースト',
      'pesto': 'ペスト',
      'salsa': 'サルサ',
      'hot sauce': 'ホットソース',
      'bbq sauce': 'バーベキューソース',
      'teriyaki sauce': '照り焼きソース',
      // その他の調味料
      'baking powder': 'ベーキングパウダー',
      'baking soda': '重曹',
      'yeast': 'イースト',
      'gelatin': 'ゼラチン',
      'cornstarch': 'コーンスターチ',
      'cocoa': 'ココア',
      'chocolate': 'チョコレート',
      'vanilla': 'バニラ',
      'cinnamon': 'シナモン',
      'nutmeg': 'ナツメグ',
      'clove': 'クローブ',
      'cardamom': 'カルダモン',
      'mint': 'ミント',
      'cilantro': 'パクチー',
      'dill': 'ディル',
      'sage': 'セージ',
      'tarragon': 'タラゴン',
      // 海産物
      'squid': 'イカ',
      'octopus': 'タコ',
      'crab': 'カニ',
      'lobster': 'ロブスター',
      'scallop': 'ホタテ',
      'oyster': 'カキ',
      'clam': 'アサリ',
      'mussel': 'ムール貝',
      // パン・麺類
      'baguette': 'バゲット',
      'tortilla': 'トルティーヤ',
      'pita': 'ピタパン',
      'spaghetti': 'スパゲティ',
      'macaroni': 'マカロニ',
      'lasagna': 'ラザニア',
      'udon': 'うどん',
      'soba': 'そば',
      'ramen': 'ラーメン'
    };
    
    let translated = ingredient.toLowerCase();
    
    // 複数形を先に変換
    Object.entries(translations).forEach(([en, jp]) => {
      const regex = new RegExp(`\\b${en}\\b`, 'gi');
      translated = translated.replace(regex, jp);
    });
    
    return translated;
  };
  
  const translateArea = (area) => {
    if (!area) return '';
    const areas = {
      'American': 'アメリカ',
      'British': 'イギリス',
      'Canadian': 'カナダ',
      'Chinese': '中華',
      'Croatian': 'クロアチア',
      'Dutch': 'オランダ',
      'Egyptian': 'エジプト',
      'French': 'フランス',
      'Greek': 'ギリシャ',
      'Indian': 'インド',
      'Irish': 'アイルランド',
      'Italian': 'イタリア',
      'Jamaican': 'ジャマイカ',
      'Japanese': '日本',
      'Kenyan': 'ケニア',
      'Malaysian': 'マレーシア',
      'Mexican': 'メキシコ',
      'Moroccan': 'モロッコ',
      'Polish': 'ポーランド',
      'Portuguese': 'ポルトガル',
      'Russian': 'ロシア',
      'Spanish': 'スペイン',
      'Thai': 'タイ',
      'Tunisian': 'チュニジア',
      'Turkish': 'トルコ',
      'Unknown': 'その他',
      'Vietnamese': 'ベトナム'
    };
    return areas[area] || area;
  };
  
  const translateCategory = (category) => {
    if (!category) return '';
    const categories = {
      'Beef': 'ビーフ',
      'Breakfast': '朝食',
      'Chicken': 'チキン',
      'Dessert': 'デザート',
      'Goat': 'ヤギ肉',
      'Lamb': 'ラム',
      'Miscellaneous': 'その他',
      'Pasta': 'パスタ',
      'Pork': 'ポーク',
      'Seafood': 'シーフード',
      'Side': 'サイドディッシュ',
      'Starter': '前菜',
      'Vegan': 'ビーガン',
      'Vegetarian': 'ベジタリアン'
    };
    return categories[category] || category;
  };
  
  const translateMealName = (name) => {
    const translations = {
      'chicken': 'チキン',
      'beef': 'ビーフ',
      'pork': 'ポーク',
      'fish': '魚',
      'curry': 'カレー',
      'rice': 'ライス',
      'noodle': 'ヌードル',
      'soup': 'スープ',
      'salad': 'サラダ',
      'stew': 'シチュー',
      'pasta': 'パスタ',
      'sandwich': 'サンドイッチ',
      'burger': 'バーガー',
      'pizza': 'ピザ',
      'teriyaki': '照り焼き'
    };
    
    let translated = name;
    Object.entries(translations).forEach(([en, jp]) => {
      translated = translated.replace(new RegExp(en, 'gi'), jp);
    });
    
    return translated;
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

  const RecipeSection = ({ title, recipes, icon }) => (
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
                <img src={recipe.image} alt={recipe.name} />
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
  );

  
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
                  <img src={recipe.image} alt={recipe.name} />
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
              <img src={recipe.image} alt={recipe.name} />
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
                <img src={recipe.image} alt={recipe.name} />
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
          <div className="recipe-header">
            <button 
              className={`bookmark-btn ${bookmarks.includes(selectedRecipe.id) ? 'bookmarked' : ''}`}
              onClick={() => toggleBookmark(selectedRecipe.id)}
            >
              ♡
            </button>
            <button 
              className={`cooking-mode-btn ${cookingMode ? 'active' : ''}`}
              onClick={toggleCookingMode}
            >
              👨‍🍳 {cookingMode ? '調理中' : '調理開始'}
            </button>
          </div>
          
          {cookingMode && (
            <div className="cooking-progress-bar">
              <div className="progress-header">
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

          <div className="recipe-hero">
            <img src={selectedRecipe.image} alt={selectedRecipe.name} />
            <div className="recipe-hero-content">
              <h1>{selectedRecipe.name}</h1>
              <p>{selectedRecipe.description}</p>
              <div className="recipe-stats">
                <span className="time">⏰ {selectedRecipe.cookingTime}</span>
                <span className="difficulty">{selectedRecipe.difficulty}</span>
              </div>
            </div>
          </div>

          <div className="recipe-content">
            <div className="ingredients-section">
              <div className="servings-selector">
                <span className="servings-label">人数：</span>
                <div className="servings-buttons">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      className={`serving-btn ${(selectedServings[selectedRecipe.id] || selectedRecipe.servings) === num ? 'active' : ''}`}
                      onClick={() => setSelectedServings(prev => ({
                        ...prev,
                        [selectedRecipe.id]: num
                      }))}
                    >
                      {num}人分
                    </button>
                  ))}
                </div>
              </div>
              <div className="ingredients-header">
                <h3>材料</h3>
                <div className="ingredients-progress">
                  <span className="progress-text">
                    {getCheckedCount(selectedRecipe.id, selectedRecipe.ingredients.length)}/
                    {selectedRecipe.ingredients.length} 完了
                  </span>
                  <div className="ingredients-controls">
                    <button 
                      className="control-btn"
                      onClick={() => toggleAllIngredients(selectedRecipe.id, selectedRecipe.ingredients.length, true)}
                    >
                      全てチェック
                    </button>
                    <button 
                      className="control-btn"
                      onClick={() => toggleAllIngredients(selectedRecipe.id, selectedRecipe.ingredients.length, false)}
                    >
                      全て解除
                    </button>
                  </div>
                </div>
              </div>
              <ul className="ingredients-list">
                {getAdjustedIngredients(selectedRecipe).map((ingredient, index) => {
                  const key = `${selectedRecipe.id}-${index}`;
                  const isChecked = checkedIngredients[key] || false;
                  return (
                    <li key={index} className="ingredient-item">
                      <label className="ingredient-label">
                        <input
                          type="checkbox"
                          className="ingredient-checkbox"
                          checked={isChecked}
                          onChange={() => toggleIngredient(selectedRecipe.id, index)}
                        />
                        <span className="custom-checkbox"></span>
                        <span className={`ingredient-text ${isChecked ? 'checked' : ''}`}>
                          {ingredient}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            <div className="instructions-section">
              <h3>作り方</h3>
              <ol>
                {selectedRecipe.instructions.map((step, index) => {
                  const time = extractTimeFromStep(step);
                  const timerId = `${selectedRecipe.id}-${index}`;
                  const timer = timers[timerId];
                  
                  return (
                    <li key={index} className="instruction-step">
                      <span className="step-text">{step}</span>
                      {time && (
                        <div className="timer-container">
                          {!timer ? (
                            <button
                              className="timer-btn start"
                              onClick={() => startTimer(selectedRecipe.id, index, time)}
                            >
                              ⏱️ {Math.floor(time / 60)}分
                            </button>
                          ) : timer.isCompleted ? (
                            <button
                              className="timer-btn completed"
                              onClick={() => stopTimer(selectedRecipe.id, index)}
                            >
                              ✅ 完了！
                            </button>
                          ) : (
                            <div className="timer-active">
                              <span className={`timer-display ${timer.remaining <= 10 ? 'warning' : ''}`}>
                                {formatTime(timer.remaining)}
                              </span>
                              {timer.isPaused ? (
                                <button
                                  className="timer-btn resume"
                                  onClick={() => resumeTimer(selectedRecipe.id, index)}
                                >
                                  ▶️
                                </button>
                              ) : (
                                <button
                                  className="timer-btn pause"
                                  onClick={() => pauseTimer(selectedRecipe.id, index)}
                                >
                                  ⏸️
                                </button>
                              )}
                              <button
                                className="timer-btn stop"
                                onClick={() => stopTimer(selectedRecipe.id, index)}
                              >
                                ⏹️
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
            
            <div className="memo-section">
              <div className="memo-header">
                <h3>📝 メモ</h3>
                {memos[selectedRecipe.id] && (
                  <button 
                    className="clear-memo-btn"
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
              <div className="memo-container">
                <textarea
                  className="memo-textarea"
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
                <div className="memo-counter">
                  {(memos[selectedRecipe.id] || '').length}/200
                </div>
              </div>
            </div>
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

  return (
    <div className="App mobile-app">
      <header className="app-header">
        <h1>🍳 レシピアプリ</h1>
      </header>
      
      <main className="app-main">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'search' && renderSearch()}
        {activeTab === 'bookmarks' && renderBookmarks()}
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
