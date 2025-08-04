import React, { useState } from 'react';
import './IngredientOptimizer.css';

// APIサービス関数をコンポーネント内で定義
const optimizeIngredientsAPI = async (recipe, ingredientsToOptimize) => {
  console.log('API呼び出し開始:', { recipe: recipe.name, adjustments: ingredientsToOptimize });
  
  try {
    const response = await fetch('http://localhost:3001/api/optimize-ingredients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipe,
        ingredientsToOptimize
      }),
    });

    console.log('APIレスポンス受信:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('APIレスポンスデータ:', data);
    return data;
  } catch (error) {
    console.error('API呼び出しエラー:', error);
    return {
      success: false,
      error: error.message || 'ネットワークエラーが発生しました'
    };
  }
};

const IngredientOptimizer = ({ recipe, ingredients, onOptimizedIngredientsUpdate, onSelectionCountChange }) => {
  console.log('IngredientOptimizer レンダリング:', recipe?.name, ingredients?.length);
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [ingredientsToOptimize, setIngredientsToOptimize] = useState([]);

  // 食材の使い切りトグル
  const toggleOptimizeIngredient = (ingredient, index) => {
    const current = ingredientsToOptimize.find(item => item.index === index);
    
    if (current) {
      // 既に選択されている場合は削除
      setIngredientsToOptimize(prev => {
        const newList = prev.filter(item => item.index !== index);
        // 選択カウントを更新
        if (onSelectionCountChange) {
          onSelectionCountChange(newList.length);
        }
        return newList;
      });
    } else {
      // 新しく追加
      const match = ingredient.match(/^(.+?)\s+([\d./]+)(g|ml|個|本|片|膳分|丁|箱|枚|つ|人分|大さじ|小さじ|カップ)?(.*)$/);
      
      if (match) {
        const [, name, quantity, unit = '', rest] = match;
        const newOptimization = {
          index,
          ingredient: name.trim(),
          currentAmount: `${quantity}${unit}${rest}`.trim(),
          desiredAmount: `${parseFloat(quantity) * 2}${unit}${rest}`.trim(), // デフォルトで2倍
          unit: unit
        };
        
        setIngredientsToOptimize(prev => {
          const newList = [...prev, newOptimization];
          // 選択カウントを更新
          if (onSelectionCountChange) {
            onSelectionCountChange(newList.length);
          }
          return newList;
        });
      }
    }
  };

  // 希望量の更新
  const updateDesiredAmount = (index, newAmount) => {
    setIngredientsToOptimize(prev =>
      prev.map(item => 
        item.index === index 
          ? { ...item, desiredAmount: newAmount }
          : item
      )
    );
  };

  // 最適化実行
  const handleOptimize = async () => {
    if (ingredientsToOptimize.length === 0) {
      alert('使い切りたい食材を選択してください');
      return;
    }

    setIsOptimizing(true);
    
    try {
      const result = await optimizeIngredientsAPI(recipe, ingredientsToOptimize);
      
      if (result.success) {
        setOptimizationResult(result.data);
        setShowModal(true);
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      console.error('Optimization error:', error);
      alert('最適化に失敗しました。しばらく後でお試しください。');
    } finally {
      setIsOptimizing(false);
    }
  };

  // 最適化結果を適用
  const applyOptimization = () => {
    if (optimizationResult && optimizationResult.adjustedIngredients) {
      const newIngredients = [...ingredients];
      
      optimizationResult.adjustedIngredients.forEach(adjusted => {
        const index = newIngredients.findIndex(ing => 
          ing.includes(adjusted.ingredient)
        );
        
        if (index !== -1) {
          // 材料名を保持して量だけ更新
          const ingredientName = adjusted.ingredient;
          newIngredients[index] = `${ingredientName} ${adjusted.adjustedAmount}`;
        }
      });
      
      onOptimizedIngredientsUpdate(newIngredients);
      setShowModal(false);
      setIngredientsToOptimize([]);
      setOptimizationResult(null);
      // カウントをリセット
      if (onSelectionCountChange) {
        onSelectionCountChange(0);
      }
    }
  };

  console.log('IngredientOptimizer レンダリング実行中');
  
  return (
    <div className="ingredient-optimizer">
      <div className="optimizer-header">
        <p className="optimizer-description">
          余った食材を使い切りたい時にチェック。AIが味のバランスを保つ調整案を提案します。
        </p>
      </div>

      <div className="ingredients-list" style={{marginTop: '15px'}}>
        <h5 style={{color: '#495057', margin: '0 0 10px 0'}}>
          📋 材料を選択して調整:
        </h5>
        {ingredients.map((ingredient, index) => {
          const isSelected = ingredientsToOptimize.some(item => item.index === index);
          const selectedItem = ingredientsToOptimize.find(item => item.index === index);
          
          return (
            <div 
              key={index} 
              style={{
                border: '1px solid #ddd',
                borderRadius: '6px',
                padding: '10px',
                margin: '5px 0',
                backgroundColor: isSelected ? '#e3f2fd' : '#ffffff'
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOptimizeIngredient(ingredient, index)}
                    style={{marginRight: '8px'}}
                  />
                  <span style={{fontWeight: isSelected ? 'bold' : 'normal'}}>
                    {ingredient}
                  </span>
                </label>
              </div>
              
              {isSelected && selectedItem && (
                <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px'}}>
                  <div style={{marginBottom: '8px'}}>
                    <label style={{display: 'block', fontSize: '14px', color: '#495057', marginBottom: '4px'}}>
                      希望量を入力:
                    </label>
                    <input
                      type="text"
                      value={selectedItem.desiredAmount}
                      onChange={(e) => updateDesiredAmount(index, e.target.value)}
                      placeholder="例: 1個, 200g, 2本"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{fontSize: '12px', color: '#6c757d'}}>
                    💡 現在: {selectedItem.currentAmount} → 希望: {selectedItem.desiredAmount}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {ingredientsToOptimize.length > 0 && (
        <div style={{marginTop: '20px', textAlign: 'center'}}>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            style={{
              backgroundColor: isOptimizing ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isOptimizing ? 'not-allowed' : 'pointer',
              marginBottom: '10px',
              display: 'block',
              width: '100%'
            }}
          >
            {isOptimizing ? (
              <>⏳ AI最適化実行中...</>
            ) : (
              <>🤖 AI最適化を実行</>
            )}
          </button>
          
          <div style={{
            fontSize: '14px', 
            color: '#495057',
            padding: '8px',
            backgroundColor: '#e9ecef',
            borderRadius: '4px'
          }}>
            📊 {ingredientsToOptimize.length}件の食材を調整予定
          </div>
        </div>
      )}

      {/* 最適化結果表示 */}
      {showModal && optimizationResult && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '10px'
            }}>
              <h3 style={{margin: 0, color: '#495057'}}>🤖 AI最適化提案</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×
              </button>
            </div>
            
            <div>
              <div style={{marginBottom: '15px'}}>
                <h4 style={{color: '#495057', margin: '0 0 10px 0'}}>📋 調整概要</h4>
                <p style={{margin: 0, lineHeight: 1.5}}>{optimizationResult.summary}</p>
              </div>

              {optimizationResult.adjustedIngredients && optimizationResult.adjustedIngredients.length > 0 && (
                <div style={{marginBottom: '15px'}}>
                  <h4 style={{color: '#495057', margin: '0 0 10px 0'}}>📝 材料調整案</h4>
                  {optimizationResult.adjustedIngredients.map((item, index) => (
                    <div key={index} style={{
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      padding: '10px',
                      margin: '8px 0'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '5px',
                        fontWeight: 'bold'
                      }}>
                        <span>{item.ingredient}</span>
                        <span style={{color: '#007bff'}}>
                          {item.originalAmount} → {item.adjustedAmount}
                        </span>
                      </div>
                      <div style={{fontSize: '14px', color: '#6c757d'}}>
                        💭 {item.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {optimizationResult.cookingTips && optimizationResult.cookingTips.length > 0 && (
                <div style={{marginBottom: '20px'}}>
                  <h4 style={{color: '#495057', margin: '0 0 10px 0'}}>💡 調理のコツ</h4>
                  <ul style={{margin: 0, paddingLeft: '20px'}}>
                    {optimizationResult.cookingTips.map((tip, index) => (
                      <li key={index} style={{margin: '5px 0', lineHeight: 1.4}}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              borderTop: '1px solid #dee2e6',
              paddingTop: '15px'
            }}>
              <button 
                onClick={applyOptimization}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ✅ この調整を適用
              </button>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientOptimizer;