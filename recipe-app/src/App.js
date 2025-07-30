import React, { useState, useEffect } from 'react';
import './App.css';
import { recipesData } from './data/recipes';

function App() {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [bookmarks, setBookmarks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedIngredients, setCheckedIngredients] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('checkedIngredients');
    if (saved) {
      setCheckedIngredients(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('checkedIngredients', JSON.stringify(checkedIngredients));
  }, [checkedIngredients]);

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
            onClick={() => setSelectedRecipe(recipe)}
          >
            <div className="recipe-image">
              <img src={recipe.image} alt={recipe.name} />
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
            onClick={() => setSelectedRecipe(recipe)}
          >
            <div className="recipe-image">
              <img src={recipe.image} alt={recipe.name} />
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
              onClick={() => setSelectedRecipe(recipe)}
            >
              <div className="recipe-image">
                <img src={recipe.image} alt={recipe.name} />
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

  if (selectedRecipe) {
    return (
      <div className="App mobile-app">
        <div className="recipe-detail-fullscreen">
          <div className="recipe-header">
            <button 
              className="back-btn"
              onClick={() => setSelectedRecipe(null)}
            >
              ← 戻る
            </button>
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
                {selectedRecipe.ingredients.map((ingredient, index) => {
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
                {selectedRecipe.instructions.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App mobile-app">
      <header className="app-header">
        <h1>🍳 レシピアプリ</h1>
      </header>
      
      <main className="app-main">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'search' && renderSearch()}
        {activeTab === 'bookmarks' && renderBookmarks()}
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
    </div>
  );
}

export default App;
