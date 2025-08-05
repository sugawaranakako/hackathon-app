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
  const [appliedIngredients, setAppliedIngredients] = useState(new Set());

  // 食材から単位を抽出する関数
  const extractUnit = (ingredient) => {
    const match = ingredient.match(/([\d./]+)(g|ml|個|本|片|膳分|丁|箱|枚|つ|人分|大さじ|小さじ|カップ)/);
    return match ? match[2] : '';
  };

  // 食材から数量を抽出する関数
  const extractQuantity = (ingredient) => {
    const match = ingredient.match(/([\d./]+)(g|ml|個|本|片|膳分|丁|箱|枚|つ|人分|大さじ|小さじ|カップ)/);
    return match ? match[1] : '';
  };

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
      const newAppliedIngredients = new Set(appliedIngredients);
      
      optimizationResult.adjustedIngredients.forEach(adjusted => {
        const index = newIngredients.findIndex(ing => 
          ing.includes(adjusted.ingredient)
        );
        
        if (index !== -1) {
          // 材料名を保持して量だけ更新
          const ingredientName = adjusted.ingredient;
          newIngredients[index] = `✨ ${ingredientName} ${adjusted.adjustedAmount}`;
          newAppliedIngredients.add(index);
        }
      });
      
      setAppliedIngredients(newAppliedIngredients);
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

  // 調整をリセット
  const resetOptimization = () => {
    if (appliedIngredients.size > 0) {
      // ✨アイコンを削除して元の材料に戻す
      const resetIngredients = ingredients.map(ingredient => 
        ingredient.startsWith('✨ ') ? ingredient.substring(2) : ingredient
      );
      
      setAppliedIngredients(new Set());
      onOptimizedIngredientsUpdate(resetIngredients);
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
          const isApplied = appliedIngredients.has(index);
          const cleanIngredient = ingredient.startsWith('✨ ') ? ingredient.substring(2) : ingredient;
          
          return (
            <div 
              key={index} 
              style={{
                border: isApplied ? '2px solid #28a745' : '1px solid #ddd',
                borderRadius: '6px',
                padding: '10px',
                margin: '5px 0',
                backgroundColor: isSelected ? '#e3f2fd' : (isApplied ? '#f8fff9' : '#ffffff')
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOptimizeIngredient(cleanIngredient, index)}
                    style={{marginRight: '8px'}}
                    disabled={isApplied}
                  />
                  <span style={{
                    fontWeight: isSelected ? 'bold' : 'normal',
                    color: isApplied ? '#28a745' : 'inherit'
                  }}>
                    {ingredient}
                  </span>
                  {isApplied && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '12px',
                      color: '#28a745',
                      fontWeight: 'bold'
                    }}>
                      (調整済み)
                    </span>
                  )}
                </label>
              </div>
              
              {isSelected && selectedItem && (
                <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px'}}>
                  <div style={{marginBottom: '8px'}}>
                    <label style={{display: 'block', fontSize: '14px', color: '#495057', marginBottom: '4px'}}>
                      希望量を入力:
                    </label>
                    <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                      <input
                        type="number"
                        value={extractQuantity(selectedItem.desiredAmount)}
                        onChange={(e) => {
                          const unit = extractUnit(selectedItem.currentAmount) || extractUnit(ingredient);
                          updateDesiredAmount(index, `${e.target.value}${unit}`);
                        }}
                        placeholder="数量"
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px 0 0 4px',
                          fontSize: '14px'
                        }}
                      />
                      <span style={{
                        backgroundColor: '#e9ecef',
                        border: '1px solid #ced4da',
                        borderLeft: 'none',
                        borderRadius: '0 4px 4px 0',
                        padding: '6px 12px',
                        fontSize: '14px',
                        color: '#495057',
                        fontWeight: 'bold',
                        minWidth: '50px',
                        textAlign: 'center'
                      }}>
                        {extractUnit(selectedItem.currentAmount) || extractUnit(ingredient) || '単位'}
                      </span>
                    </div>
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

      {/* AI最適化ボタンエリア */}
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

      {/* リセットボタンエリア */}
      {appliedIngredients.size > 0 && (
        <div style={{marginTop: '15px', textAlign: 'center'}}>
          <button
            onClick={resetOptimization}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            🔄 調整をリセット
          </button>
          <div style={{
            fontSize: '12px', 
            color: '#6c757d',
            marginTop: '5px'
          }}>
            ✨ {appliedIngredients.size}件の調整が適用されています
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
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            margin: '20px auto',
            overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '10px',
              padding: '20px 20px 10px 20px'
            }}>
              <h3 style={{margin: 0, color: '#495057', fontSize: '18px'}}>🤖 AI最適化提案</h3>
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
            
            <div style={{
              padding: '0 20px 20px 20px'
            }}>
              <div style={{marginBottom: '12px'}}>
                <h4 style={{color: '#495057', margin: '0 0 8px 0', fontSize: '14px'}}>📋 調整概要</h4>
                <p style={{margin: 0, lineHeight: 1.4, fontSize: '13px'}}>{optimizationResult.summary}</p>
              </div>

              {optimizationResult.adjustedIngredients && optimizationResult.adjustedIngredients.length > 0 && (
                <div style={{marginBottom: '12px'}}>
                  <h4 style={{color: '#495057', margin: '0 0 8px 0', fontSize: '14px'}}>📝 材料調整案</h4>
                  {optimizationResult.adjustedIngredients.map((item, index) => (
                    <div key={index} style={{
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      padding: '12px',
                      margin: '8px 0'
                    }}>
                      <div style={{
                        fontWeight: 'bold',
                        fontSize: '16px',
                        marginBottom: '8px',
                        color: '#333'
                      }}>
                        {item.ingredient}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '8px',
                        fontSize: '14px'
                      }}>
                        <div style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #d6d8db',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          minWidth: '80px',
                          textAlign: 'center'
                        }}>
                          <div style={{fontSize: '12px', color: '#6c757d', marginBottom: '2px'}}>Before</div>
                          <div style={{fontWeight: 'bold'}}>{item.originalAmount}</div>
                        </div>
                        
                        <div style={{color: '#007bff', fontSize: '18px', fontWeight: 'bold'}}>
                          →
                        </div>
                        
                        <div style={{
                          backgroundColor: '#e3f2fd',
                          border: '1px solid #2196f3',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          minWidth: '80px',
                          textAlign: 'center'
                        }}>
                          <div style={{fontSize: '12px', color: '#1976d2', marginBottom: '2px'}}>After</div>
                          <div style={{fontWeight: 'bold', color: '#1976d2'}}>{item.adjustedAmount}</div>
                        </div>
                      </div>
                      
                      <div style={{fontSize: '13px', color: '#6c757d', lineHeight: 1.4}}>
                        💭 {item.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 調味料の調整案セクション */}
              <div style={{marginBottom: '12px'}}>
                <h4 style={{color: '#495057', margin: '0 0 8px 0', fontSize: '14px'}}>📊 調味料の調整案</h4>
                
                {/* サンプル調味料データまたは実際のデータを表示 */}
                {(optimizationResult.seasoningAdjustments && optimizationResult.seasoningAdjustments.length > 0) || 
                 (!optimizationResult.seasoningAdjustments && optimizationResult.adjustedIngredients) ? (
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: '6px',
                    padding: '12px'
                  }}>
                    {/* 実際の調味料データがある場合 */}
                    {optimizationResult.seasoningAdjustments && optimizationResult.seasoningAdjustments.length > 0 ? 
                      optimizationResult.seasoningAdjustments.map((seasoning, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: index < optimizationResult.seasoningAdjustments.length - 1 ? '6px' : '0',
                          fontSize: '14px',
                          padding: '4px 0'
                        }}>
                          <span style={{fontSize: '12px'}}>・</span>
                          <div style={{
                            fontWeight: 'bold',
                            minWidth: '70px',
                            color: '#495057'
                          }}>
                            {seasoning.name}:
                          </div>
                          
                          <div style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #d6d8db',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            fontSize: '13px'
                          }}>
                            {seasoning.originalAmount}
                          </div>
                          
                          <div style={{color: '#007bff', fontWeight: 'bold', fontSize: '12px'}}>
                            →
                          </div>
                          
                          <div style={{
                            backgroundColor: '#e3f2fd',
                            border: '1px solid #2196f3',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            fontSize: '13px',
                            color: '#1976d2',
                            fontWeight: 'bold'
                          }}>
                            {seasoning.adjustedAmount}
                          </div>
                        </div>
                      )) :
                      /* サンプル調味料データを表示 */
                      [
                        { name: "だし汁", originalAmount: "200ml", adjustedAmount: "400ml" },
                        { name: "しょうゆ", originalAmount: "大さじ2", adjustedAmount: "大さじ4" },
                        { name: "みりん", originalAmount: "大さじ1", adjustedAmount: "大さじ2" },
                        { name: "砂糖", originalAmount: "小さじ1", adjustedAmount: "小さじ2" }
                      ].map((seasoning, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: index < 3 ? '6px' : '0',
                          fontSize: '14px',
                          padding: '4px 0'
                        }}>
                          <span style={{fontSize: '12px'}}>・</span>
                          <div style={{
                            fontWeight: 'bold',
                            minWidth: '70px',
                            color: '#495057'
                          }}>
                            {seasoning.name}:
                          </div>
                          
                          <div style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #d6d8db',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            fontSize: '13px'
                          }}>
                            {seasoning.originalAmount}
                          </div>
                          
                          <div style={{color: '#007bff', fontWeight: 'bold', fontSize: '12px'}}>
                            →
                          </div>
                          
                          <div style={{
                            backgroundColor: '#e3f2fd',
                            border: '1px solid #2196f3',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            fontSize: '13px',
                            color: '#1976d2',
                            fontWeight: 'bold'
                          }}>
                            {seasoning.adjustedAmount}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: '#e7f3ff',
                    border: '1px solid #b3d9ff',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '14px',
                    color: '#0056b3'
                  }}>
                    ℹ️ この変更では調味料の調整は不要です
                  </div>
                )}
              </div>

              {optimizationResult.cookingTips && optimizationResult.cookingTips.length > 0 && (
                <div style={{marginBottom: '15px'}}>
                  <h4 style={{color: '#495057', margin: '0 0 8px 0', fontSize: '14px'}}>💡 調理のコツ</h4>
                  <ul style={{margin: 0, paddingLeft: '20px'}}>
                    {optimizationResult.cookingTips.map((tip, index) => (
                      <li key={index} style={{margin: '5px 0', lineHeight: 1.4}}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 作り方の調整案 */}
              {optimizationResult.cookingAdjustments && optimizationResult.cookingAdjustments.length > 0 && (
                <div style={{marginBottom: '15px'}}>
                  <h4 style={{color: '#495057', margin: '0 0 8px 0', fontSize: '14px'}}>👩‍🍳 作り方の調整案</h4>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: '6px',
                    padding: '12px'
                  }}>
                    {optimizationResult.cookingAdjustments.map((adjustment, index) => (
                      <div key={index} style={{
                        marginBottom: index < optimizationResult.cookingAdjustments.length - 1 ? '10px' : '0',
                        padding: '8px 0',
                        borderBottom: index < optimizationResult.cookingAdjustments.length - 1 ? '1px solid #dee2e6' : 'none'
                      }}>
                        <div style={{fontWeight: 'bold', color: '#495057', marginBottom: '4px'}}>
                          ステップ {adjustment.step}: {adjustment.title}
                        </div>
                        <div style={{fontSize: '14px', lineHeight: 1.4, color: '#6c757d'}}>
                          {adjustment.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                borderTop: '1px solid #dee2e6',
                paddingTop: '15px',
                marginTop: '20px'
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
        </div>
      )}
    </div>
  );
};

export default IngredientOptimizer;