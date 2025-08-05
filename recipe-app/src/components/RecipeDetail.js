import React, { useState } from 'react';
import SmartIngredientOptimizer from './SmartIngredientOptimizer';

const RecipeDetail = ({ recipe, onClose }) => {
  // State for current ingredients (can be modified by optimization)
  const [currentIngredients, setCurrentIngredients] = useState(recipe?.ingredients || []);
  // State for active tab
  const [activeTab, setActiveTab] = useState('recipe');

  console.log('🎯 RecipeDetail COMPONENT IS RUNNING!!! activeTab:', activeTab, 'recipe:', recipe?.name);
  console.log('🎯 RecipeDetail props:', { recipe: recipe?.name, onClose: typeof onClose });

  if (!recipe) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Close button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#999'
          }}
        >
          ×
        </button>

        {/* Recipe header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            color: '#333', 
            marginBottom: '8px',
            fontSize: '24px',
            fontWeight: 'bold' 
          }}>
            {recipe.name}
          </h2>
          <div style={{ display: 'flex', gap: '16px', color: '#666', fontSize: '14px' }}>
            <span>⏱️ {recipe.cookingTime || '30分'}</span>
            <span>👥 {recipe.servings || '2-3人分'}</span>
            <span>⭐ {recipe.difficulty || '普通'}</span>
          </div>
        </div>

        {/* タブヘッダー */}
        <div className="tabs" style={{
          display: 'flex',
          borderBottom: '1px solid #e0e0e0',
          marginBottom: '20px',
          backgroundColor: 'yellow', // デバッグ用：黄色の背景
          minHeight: '60px' // デバッグ用：最小高さ
        }}>
          {console.log('🔥 タブ表示確認:', activeTab)}
          {console.log('🔥 タブボタンをレンダリング中...')}
          <button 
            className={`tab-button ${activeTab === 'recipe' ? 'active' : ''}`}
            onClick={() => setActiveTab('recipe')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'recipe' ? '#007bff' : 'transparent',
              color: activeTab === 'recipe' ? 'white' : '#666',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            レシピ
          </button>
          <button 
            className={`tab-button ${activeTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => setActiveTab('nutrition')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'nutrition' ? '#007bff' : 'transparent',
              color: activeTab === 'nutrition' ? 'white' : '#666',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            栄養価
          </button>
          <button 
            className={`tab-button ${activeTab === 'advice' ? 'active' : ''}`}
            onClick={() => setActiveTab('advice')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'advice' ? '#007bff' : 'transparent',
              color: activeTab === 'advice' ? 'white' : '#666',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            アドバイス
          </button>
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'recipe' && (
          <div className="recipe-tab-content">
            {/* Ingredients section */}
            <div className="ingredients-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                color: '#333',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🥬 材料
              </h3>
              <div style={{
                display: 'grid',
                gap: '8px',
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px'
              }}>
                {currentIngredients.map((ingredient, index) => (
                  <div key={index} style={{
                    padding: '8px 12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    {ingredient}
                  </div>
                ))}
              </div>
            </div>

            {/* 賢い食材使い切りセクション */}
            <div className="smart-ingredients" style={{
              margin: '20px 0',
              padding: '20px',
              backgroundColor: '#e3f2fd',
              borderRadius: '16px',
              border: '3px solid red' // デバッグ用：赤い枠線
            }}>
              {console.log('🧅 賢い食材使い切りセクション レンダリング中...')}
              <h3 style={{ 
                marginBottom: '16px', 
                fontSize: '20px', 
                fontWeight: 'bold',
                color: '#333'
              }}>
                🧅 賢い食材使い切り
              </h3>
              <p style={{ marginBottom: '16px', color: '#666' }}>
                使い切りたい食材の量を調整して、AIが味のバランスを保つ調整案を提案します
              </p>
              
              <SmartIngredientOptimizer 
                recipe={recipe}
                ingredients={currentIngredients}
                onOptimizedIngredientsUpdate={(optimizedIngredients) => {
                  setCurrentIngredients(optimizedIngredients);
                }}
              />
            </div>

            {/* Instructions section */}
            {recipe.instructions && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ 
                  color: '#333',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📝 作り方
                </h3>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px'
                }}>
                  {Array.isArray(recipe.instructions) ? (
                    <ol style={{ margin: 0, paddingLeft: '20px' }}>
                      {recipe.instructions.map((step, index) => (
                        <li key={index} style={{ 
                          marginBottom: '12px',
                          lineHeight: '1.6',
                          color: '#333'
                        }}>
                          {step}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p style={{ margin: 0, lineHeight: '1.6', color: '#333' }}>
                      {recipe.instructions}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="nutrition-tab-content">
            <h3 style={{ color: '#333', marginBottom: '16px' }}>📊 栄養価情報</h3>
            <div style={{
              backgroundColor: '#f0f8ff',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#666' }}>栄養価計算機能は開発中です</p>
              <p style={{ color: '#999', fontSize: '14px' }}>カロリー、タンパク質、炭水化物などの詳細情報を表示予定</p>
            </div>
          </div>
        )}

        {activeTab === 'advice' && (
          <div className="advice-tab-content">
            <h3 style={{ color: '#333', marginBottom: '16px' }}>💡 料理のコツ</h3>
            {recipe.tips && recipe.tips.length > 0 ? (
              <div style={{
                backgroundColor: '#fff8dc',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {recipe.tips.map((tip, index) => (
                    <li key={index} style={{ 
                      marginBottom: '8px',
                      lineHeight: '1.6',
                      color: '#333'
                    }}>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p style={{ color: '#666' }}>このレシピにはコツ情報がありません</p>
            )}

            {recipe.sideDishes && recipe.sideDishes.length > 0 && (
              <div>
                <h4 style={{ color: '#333', marginBottom: '12px' }}>🍽️ おすすめの副菜</h4>
                <div style={{
                  backgroundColor: '#f0fff0',
                  padding: '16px',
                  borderRadius: '8px'
                }}>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {recipe.sideDishes.map((dish, index) => (
                      <li key={index} style={{ 
                        marginBottom: '4px',
                        color: '#333'
                      }}>
                        {dish}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDetail;