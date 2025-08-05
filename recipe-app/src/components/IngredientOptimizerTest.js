import React from 'react';

const IngredientOptimizerTest = ({ recipe, ingredients }) => {
  console.log('IngredientOptimizerTest rendered');
  
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
      <h4>🧪 テスト用コンポーネント</h4>
      <p>レシピ: {recipe?.name || 'なし'}</p>
      <p>材料数: {ingredients?.length || 0}</p>
    </div>
  );
};

export default IngredientOptimizerTest;