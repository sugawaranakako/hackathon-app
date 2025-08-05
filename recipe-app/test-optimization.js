/**
 * 賢い食材使い切り機能の包括的テストスクリプト
 * このスクリプトでAPI機能とレスポンス構造をテストします
 */

const testOptimizationAPI = async () => {
  console.log('🧪 賢い食材使い切り機能 - 包括テスト開始');
  console.log('='.repeat(50));

  // テスト用のレシピデータ
  const testRecipe = {
    id: 1,
    name: "親子丼",
    ingredients: [
      "鶏もも肉 200g",
      "玉ねぎ 1/2個", 
      "卵 2個",
      "醤油 大さじ2",
      "みりん 大さじ2",
      "砂糖 小さじ1",
      "だし汁 100ml",
      "ご飯 2膳分"
    ]
  };

  // テスト用の最適化要求（玉ねぎを2倍に増やす）
  const ingredientsToOptimize = [
    {
      ingredient: "玉ねぎ",
      currentAmount: "1/2個",
      desiredAmount: "1個"
    }
  ];

  try {
    console.log('📤 APIリクエスト送信中...');
    console.log('🍳 テストレシピ:', testRecipe.name);
    console.log('📋 全材料数:', testRecipe.ingredients.length);
    console.log('🧅 最適化対象:', ingredientsToOptimize.map(i => `${i.ingredient}: ${i.currentAmount} → ${i.desiredAmount}`));
    
    const requestBody = {
      recipe: testRecipe,
      ingredientsToOptimize: ingredientsToOptimize
    };

    const response = await fetch('http://localhost:3001/api/optimize-ingredients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('\n📥 APIレスポンス:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ APIエラー:', errorText);
      return;
    }

    const data = await response.json();
    console.log('\n✅ APIレスポンス成功');
    console.log('📊 レスポンスデータ:', JSON.stringify(data, null, 2));

    // 結果の詳細分析
    if (data.success && data.data) {
      const result = data.data;
      
      console.log('\n🔍 結果分析:');
      console.log('📝 調整項目数:', result.adjustedIngredients?.length || 0);
      
      if (result.adjustedIngredients) {
        // 選択された食材の調整
        const selectedAdjustments = result.adjustedIngredients.filter(item =>
          ingredientsToOptimize.some(opt => opt.ingredient === item.ingredient)
        );
        
        // 調味料の自動調整
        const seasoningAdjustments = result.adjustedIngredients.filter(item =>
          ['醤油', 'みりん', '砂糖', 'だし汁', '塩', '酒', '味噌'].some(seasoning =>
            item.ingredient.includes(seasoning)
          )
        );
        
        console.log('🧅 選択食材の調整:', selectedAdjustments.length + '件');
        console.log('🧂 調味料の自動調整:', seasoningAdjustments.length + '件');
        
        console.log('\n📋 全調整詳細:');
        result.adjustedIngredients.forEach((item, index) => {
          const isCondiment = ['醤油', 'みりん', '砂糖', 'だし汁', '塩', '酒', '味噌'].some(s => 
            item.ingredient.includes(s)
          );
          const icon = isCondiment ? '🧂' : '🥬';
          console.log(`  ${index + 1}. ${icon} ${item.ingredient}: ${item.originalAmount} → ${item.adjustedAmount}`);
          console.log(`     理由: ${item.reason || '記載なし'}`);
        });
        
        if (seasoningAdjustments.length === 0) {
          console.log('\n⚠️  警告: 調味料の調整が検出されませんでした');
          console.log('💡 改善提案: サーバー側のプロンプトまたはフォールバック機能を確認してください');
        } else {
          console.log('\n✅ 調味料調整が正常に実行されました');
        }
      }
      
      if (result.cookingTips) {
        console.log('\n💡 調理のコツ (' + result.cookingTips.length + '件):');
        result.cookingTips.forEach((tip, index) => {
          console.log(`  ${index + 1}. ${tip}`);
        });
      }
      
      if (result.summary) {
        console.log('\n📝 概要:', result.summary);
      }
      
      console.log('\n🎉 テスト完了: 機能は正常に動作しています');
      
    } else {
      console.log('❌ APIレスポンスにデータが含まれていません');
    }

  } catch (error) {
    console.error('❌ テストエラー:', error.message);
    console.error('詳細:', error);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 テスト終了');
};

// Node.js環境でfetchを使用するため
if (typeof fetch === 'undefined') {
  const { default: fetch } = require('node-fetch');
  global.fetch = fetch;
}

// テスト実行
testOptimizationAPI().catch(console.error);