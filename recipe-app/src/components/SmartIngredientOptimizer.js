import React, { useState } from 'react';
import './SmartIngredientOptimizer.css';

// 新しいAI最適化APIエンドポイント
const optimizeIngredientsV2API = async (recipe, ingredientAdjustments) => {
  console.log('🚀 新型AI最適化API呼び出し開始:', { recipe: recipe.name, adjustments: ingredientAdjustments });
  
  try {
    const requestBody = {
      recipe,
      ingredientAdjustments
    };
    
    console.log('📤 送信するリクエストボディ:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('http://localhost:3001/api/optimize-ingredients-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 APIレスポンス受信:', {
      status: response.status,
      statusText: response.statusText
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ APIエラーレスポンス:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 APIレスポンスデータ詳細:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('API呼び出しエラー:', error);
    return {
      success: false,
      error: error.message || 'ネットワークエラーが発生しました'
    };
  }
};

const SmartIngredientOptimizer = ({ recipe, ingredients, onOptimizedIngredientsUpdate, onSelectionCountChange, onClose }) => {
  console.log('🚀 SmartIngredientOptimizer コンポーネント実行中!!! レンダリング:', recipe?.name, ingredients?.length);
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [adjustingIngredient, setAdjustingIngredient] = useState(null);
  const [adjustments, setAdjustments] = useState({});

  // 調味料を判定する関数
  const isSeasoningOrCondiment = (ingredient) => {
    const seasoningKeywords = [
      'だし', 'だし汁', 'だしの素', 'コンソメ', 'ブイヨン',
      'しょうゆ', '醤油', 'みそ', '味噌', 'みりん', 'みりん風調味料',
      '砂糖', '塩', '塩こしょう', 'こしょう', '胡椒', 'コショウ',
      '酢', '油', 'サラダ油', 'オリーブオイル', 'ごま油',
      'ソース', 'ケチャップ', 'マヨネーズ', 'ドレッシング',
      'バター', 'マーガリン', '酒', '料理酒', 'ワイン',
      'マスタード', 'からし', 'わさび', 'にんにく', 'しょうが', '生姜',
      'スパイス', '香辛料', '七味', '一味', 'カレー粉', '片栗粉',
      '薄力粉', '強力粉', '小麦粉', 'パン粉', '天ぷら粉',
      'ベーキングパウダー', '重曹', 'ゼラチン',
      '大さじ', '小さじ', '少々', '適量', '好み'
    ];
    
    const lowerIngredient = ingredient.toLowerCase();
    return seasoningKeywords.some(keyword => 
      lowerIngredient.includes(keyword) || 
      ingredient.includes(keyword)
    );
  };

  // 材料を解析して構造化データに変換
  const parseIngredient = (ingredient, index) => {
    // パターン1: "材料名 数量単位"
    const match1 = ingredient.match(/^(.+?)\\s+([\\d./]+)(g|ml|個|本|片|膳分|丁|箱|枚|つ|人分|大さじ|小さじ|カップ)?(.*)$/);
    // パターン2: "材料名: 数量単位"  
    const match2 = ingredient.match(/^(.+?):\\s*([\\d./]+)(g|ml|個|本|片|膳分|丁|箱|枚|つ|人分|大さじ|小さじ|カップ)?(.*)$/);
    
    const match = match1 || match2;
    
    if (match) {
      const [, name, quantity, unit = '', rest] = match;
      const fullUnit = (unit + rest.trim()).trim();
      return {
        id: `ingredient-${index}`,
        name: name.trim(),
        amount: `${quantity}${fullUnit}`,
        originalText: ingredient,
        quantity: parseFloat(quantity),
        unit: fullUnit,
        numericValue: parseFloat(quantity) // 数値のみを保持
      };
    }
    
    // パターンマッチしない場合
    return {
      id: `ingredient-${index}`,
      name: ingredient,
      amount: '',
      originalText: ingredient,
      quantity: 1,
      unit: '',
      numericValue: 1
    };
  };

  // 入力値のバリデーション
  const validateInput = (originalValue, newValue, unit) => {
    const originalNum = parseFloat(originalValue);
    const newNum = parseFloat(newValue);
    
    if (isNaN(newNum) || newNum <= 0) {
      return { valid: false, message: '正の数値を入力してください' };
    }
    
    // 極端な変更の警告
    const ratio = newNum / originalNum;
    if (ratio > 10) {
      return { 
        valid: true, 
        warning: `${Math.round(ratio)}倍の増量は大量になります。本当によろしいですか？` 
      };
    }
    
    if (ratio < 0.1) {
      return { 
        valid: true, 
        warning: `${Math.round((1/ratio) * 10) / 10}分の1の減量になります。本当によろしいですか？` 
      };
    }
    
    return { valid: true };
  };

  // 表示用の食材リスト（調味料を除外して構造化）
  const currentIngredients = ingredients.map((ingredient, index) => parseIngredient(ingredient, index))
    .filter(ingredient => !isSeasoningOrCondiment(ingredient.name));

  // 調整設定
  const setAdjustment = (ingredient, inputValue) => {
    console.log('📝 調整設定:', ingredient.name, '→', inputValue);
    
    if (!inputValue.trim()) {
      // 空の場合は調整を削除
      removeAdjustment(ingredient.id);
      return;
    }
    
    // 数値と単位を分離して処理
    let numericValue, newAmount;
    const numMatch = inputValue.match(/^([\\d./]+)/);
    
    if (numMatch) {
      numericValue = parseFloat(numMatch[1]);
      // 元の単位を保持して新しい分量を作成
      if (ingredient.unit) {
        newAmount = `${numericValue}${ingredient.unit}`;
      } else {
        newAmount = inputValue.trim();
      }
    } else {
      // 数値が抽出できない場合はそのまま使用
      newAmount = inputValue.trim();
    }
    
    // バリデーション
    const validation = validateInput(ingredient.numericValue, numericValue, ingredient.unit);
    
    if (!validation.valid) {
      alert(validation.message);
      return;
    }
    
    if (validation.warning) {
      if (!window.confirm(validation.warning)) {
        return;
      }
    }
    
    setAdjustments(prev => {
      const updated = {
        ...prev,
        [ingredient.id]: {
          ingredient: ingredient.name,
          originalAmount: ingredient.amount,
          newAmount: newAmount,
          originalText: ingredient.originalText
        }
      };
      
      // 選択カウントを更新
      const count = Object.keys(updated).length;
      if (onSelectionCountChange) {
        onSelectionCountChange(count);
      }
      
      return updated;
    });
    
    setAdjustingIngredient(null);
  };

  // 調整を削除
  const removeAdjustment = (ingredientId) => {
    setAdjustments(prev => {
      const updated = { ...prev };
      delete updated[ingredientId];
      
      // 選択カウントを更新
      const count = Object.keys(updated).length;
      if (onSelectionCountChange) {
        onSelectionCountChange(count);
      }
      
      return updated;
    });
  };

  // AI最適化実行
  const handleOptimize = async () => {
    if (Object.keys(adjustments).length === 0) {
      alert('調整したい食材を選択してください');
      return;
    }

    setIsOptimizing(true);
    
    try {
      console.log('=== 🧅 新型AI最適化リクエスト開始 ===');
      console.log('📝 調整された食材:', adjustments);
      console.log('📋 全ての材料:', ingredients);
      
      // 調整データを新しい形式に変換
      const ingredientAdjustments = Object.values(adjustments).map(adj => ({
        ingredient: adj.ingredient,
        originalAmount: adj.originalAmount,
        newAmount: adj.newAmount,
        originalText: adj.originalText
      }));
      
      const result = await optimizeIngredientsV2API(recipe, ingredientAdjustments);
      
      if (result.success) {
        console.log('=== ✅ 新型AI最適化レスポンス ===');
        console.log('最適化結果:', result.data);
        
        setOptimizationResult(result.data);
        setShowResultModal(true);
      } else {
        console.error('❌ 最適化失敗:', result.error);
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
    console.log('🔧 SmartIngredientOptimizer: 適用開始');
    
    if (optimizationResult && optimizationResult.adjustedIngredients) {
      const newIngredients = [...ingredients];
      console.log('📋 初期材料コピー:', newIngredients);
      
      // 調整された材料を反映
      optimizationResult.adjustedIngredients.forEach((adjusted, index) => {
        console.log(`🔍 処理中 ${index + 1}/${optimizationResult.adjustedIngredients.length}:`, adjusted);
        
        const foundIndex = newIngredients.findIndex(ing => 
          ing.includes(adjusted.ingredient)
        );
        
        if (foundIndex !== -1) {
          const oldIngredient = newIngredients[foundIndex];
          const newIngredient = `${adjusted.ingredient} ${adjusted.adjustedAmount}`;
          newIngredients[foundIndex] = newIngredient;
          console.log(`✏️ 更新成功:`, { index: foundIndex, before: oldIngredient, after: newIngredient });
        }
      });
      
      console.log('📝 適用後の材料:', newIngredients);
      onOptimizedIngredientsUpdate(newIngredients);
      
      // リセット
      setShowResultModal(false);
      setAdjustments({});
      setOptimizationResult(null);
      
      if (onSelectionCountChange) {
        onSelectionCountChange(0);
      }
      
      if (onClose) {
        onClose();
      }
      
      console.log('✅ 適用処理完了');
    }
  };

  // 調整があるかチェックする関数
  const hasAnyAdjustments = () => {
    return Object.keys(adjustments).length > 0;
  };

  // 調整をリセット
  const resetAdjustments = () => {
    setAdjustments({});
    setAdjustingIngredient(null);
    if (onSelectionCountChange) {
      onSelectionCountChange(0);
    }
  };

  return (
    <div className="smart-ingredient-optimizer">
      <div className="optimizer-header">
        <p className="optimizer-description">
          余った食材を使い切りたい時に、希望量を設定してください。AIが味のバランスを保つ最適化案を提案します。
        </p>
      </div>

      <div className="ingredients-adjustment-list" style={{marginTop: '15px'}}>
        <h5 style={{color: '#495057', margin: '0 0 10px 0'}}>
          📋 食材の調整:
        </h5>
        
        {currentIngredients.map((ingredient) => {
          const adjustment = adjustments[ingredient.id];
          const isAdjusting = adjustingIngredient === ingredient.id;
          
          return (
            <div 
              key={ingredient.id}
              className={`ingredient-adjustment-item ${adjustment ? 'has-adjustment' : ''}`}
            >
              <div className="ingredient-info">
                <span className="ingredient-name">{ingredient.name}</span>
                <span className="ingredient-amount">{ingredient.amount}</span>
                
                {adjustment && (
                  <span className="adjustment-arrow">→ {adjustment.newAmount}</span>
                )}
              </div>
              
              <div className="ingredient-controls">
                {isAdjusting ? (
                  <div className="adjustment-input-container">
                    <div className="input-with-unit">
                      <input
                        type="text"
                        className="adjustment-input"
                        defaultValue={ingredient.numericValue.toString()}
                        placeholder="希望量"
                        onBlur={(e) => setAdjustment(ingredient, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setAdjustment(ingredient, e.target.value);
                          } else if (e.key === 'Escape') {
                            setAdjustingIngredient(null);
                          }
                        }}
                        autoFocus
                      />
                      {ingredient.unit && (
                        <span className="unit-label">{ingredient.unit}</span>
                      )}
                    </div>
                    <button 
                      className="cancel-adjustment-btn"
                      onClick={() => setAdjustingIngredient(null)}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    {adjustment ? (
                      <button
                        className="remove-adjustment-btn"
                        onClick={() => removeAdjustment(ingredient.id)}
                        title="調整を削除"
                      >
                        削除
                      </button>
                    ) : (
                      <button
                        className="adjust-btn"
                        onClick={() => setAdjustingIngredient(ingredient.id)}
                      >
                        調整
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasAnyAdjustments() && (
        <div className="optimization-controls">
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="optimize-btn ai-optimize-button"
          >
            {isOptimizing ? (
              <>⏳ AI最適化実行中...</>
            ) : (
              <>🤖 AI最適化を実行</>
            )}
          </button>
          
          <button
            onClick={resetAdjustments}
            className="reset-btn"
          >
            調整をリセット
          </button>
          
          <div className="adjustment-summary">
            📊 {Object.keys(adjustments).length}件の食材を調整中
          </div>
        </div>
      )}

      {/* 最適化結果表示モーダル */}
      {showResultModal && optimizationResult && (
        <div className="optimization-result-modal-overlay">
          <div className="optimization-result-modal">
            <div className="modal-header">
              <h3>🤖 AI最適化提案</h3>
              <button 
                className="modal-close"
                onClick={() => setShowResultModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              {/* 食材の変更 */}
              {optimizationResult.ingredientChanges && optimizationResult.ingredientChanges.length > 0 && (
                <div className="result-section">
                  <h4>【食材の変更】</h4>
                  {optimizationResult.ingredientChanges.map((change, index) => (
                    <div key={index} className="change-item">
                      🥬 {change.ingredient}: {change.originalAmount} → {change.newAmount}
                    </div>
                  ))}
                </div>
              )}

              {/* 調味料の調整案 */}
              {optimizationResult.seasoningAdjustments && optimizationResult.seasoningAdjustments.length > 0 && (
                <div className="result-section">
                  <h4>【調味料の調整案】</h4>
                  {optimizationResult.seasoningAdjustments.map((adjustment, index) => (
                    <div key={index} className={adjustment.isInfoMessage ? "info-item" : "adjustment-item"}>
                      {adjustment.isInfoMessage ? (
                        <>
                          ℹ️ {adjustment.reason}
                        </>
                      ) : (
                        <>
                          ✓ 🧂 {adjustment.ingredient}: {adjustment.originalAmount} → {adjustment.adjustedAmount}
                          <span className="adjustment-reason">（{adjustment.reason}）</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 作り方の調整 */}
              {optimizationResult.cookingAdjustments && optimizationResult.cookingAdjustments.length > 0 && (
                <div className="result-section">
                  <h4>【作り方の調整】</h4>
                  {optimizationResult.cookingAdjustments.map((adjustment, index) => (
                    <div key={index} className="cooking-adjustment-item">
                      ✓ 📝 {adjustment.step}: {adjustment.adjustment}
                    </div>
                  ))}
                </div>
              )}

              {/* アドバイス */}
              {optimizationResult.advice && optimizationResult.advice.length > 0 && (
                <div className="result-section">
                  <h4>【アドバイス】</h4>
                  {optimizationResult.advice.map((tip, index) => (
                    <div key={index} className="advice-item">
                      💡 {tip}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="apply-btn"
                onClick={applyOptimization}
              >
                ✅ この調整を適用
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setShowResultModal(false)}
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

export default SmartIngredientOptimizer;