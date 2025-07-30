import React, { useState, useEffect } from 'react';
import './App.css';
import { recipesData } from './data/recipes';

function App() {
  const [openRecipes, setOpenRecipes] = useState([]);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [bookmarks, setBookmarks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [selectedServings, setSelectedServings] = useState({});
  const [timers, setTimers] = useState({});
  const [timerIntervals, setTimerIntervals] = useState({});
  const [showRecipeList, setShowRecipeList] = useState(true);
  const [notification, setNotification] = useState(null);
  const [memos, setMemos] = useState({});

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

  const filteredRecipes = recipesData.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const bookmarkedRecipes = recipesData.filter(recipe =>
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

  const renderHome = () => (
    <div className="home-content">
      <div className="search-bar">
        <input
          type="text"
          placeholder="レシピを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
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
          </div>
          
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
