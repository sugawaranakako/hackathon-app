import React, { useState } from 'react';
import './IngredientOptimizer.css';

const IngredientOptimizerSimple = ({ recipe, ingredients, onOptimizedIngredientsUpdate, onSelectionCountChange, onClose }) => {
  console.log('IngredientOptimizerSimple レンダリング:', recipe?.name, ingredients?.length);
  
  const [selectedIngredients, setSelectedIngredients] = useState([]);

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
        
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '6px',
          padding: '10px',
          margin: '5px 0',
          backgroundColor: '#ffffff'
        }}>
          <p>現在のレシピ: {recipe?.name}</p>
          <p>材料数: {ingredients?.length}</p>
          <p>選択済み: {selectedIngredients.length}件</p>
        </div>
      </div>

      <button
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginTop: '20px',
          width: '100%'
        }}
        onClick={() => console.log('簡単版テストボタンクリック')}
      >
        🤖 テスト用ボタン
      </button>
    </div>
  );
};

export default IngredientOptimizerSimple;