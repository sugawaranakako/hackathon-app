// APIサービス関数
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // プロダクションでは同じドメインを使用
  : 'http://localhost:3001'; // 開発環境

class ApiService {
  // 賢い食材使い切り機能
  static async optimizeIngredients(recipe, ingredientsToOptimize) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/optimize-ingredients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe,
          ingredientsToOptimize
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Optimize ingredients error:', error);
      return {
        success: false,
        error: error.message || 'ネットワークエラーが発生しました'
      };
    }
  }

  // 料理相談チャット
  static async sendCookingChatMessage(message, currentRecipe = null, chatHistory = []) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cooking-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          currentRecipe,
          chatHistory
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Cooking chat error:', error);
      return {
        success: false,
        error: error.message || 'ネットワークエラーが発生しました'
      };
    }
  }

  // レシピ改善提案
  static async suggestImprovements(recipe, userPreferences = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/suggest-improvements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe,
          userPreferences
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Suggest improvements error:', error);
      return {
        success: false,
        error: error.message || 'ネットワークエラーが発生しました'
      };
    }
  }

  // ヘルスチェック
  static async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health check error:', error);
      return { status: 'ERROR', error: error.message };
    }
  }
}

export default ApiService;