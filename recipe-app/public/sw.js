const CACHE_NAME = 'recipe-app-v3';
const IS_DEVELOPMENT = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap'
];

// キャッシュする外部API
const API_CACHE_NAME = 'recipe-api-v3';
const API_URLS = [
  'https://www.themealdb.com/api/json/v1/1/search.php',
  'https://www.themealdb.com/api/json/v1/1/random.php'
];

// インストール時
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('キャッシュを開いています');
          return cache.addAll(urlsToCache);
        }),
      caches.open(API_CACHE_NAME)
        .then(cache => {
          console.log('API キャッシュを開いています');
          return Promise.resolve(); // APIは実際のリクエスト時にキャッシュ
        })
    ])
  );
  // 新しいService Workerを即座にアクティブ化
  self.skipWaiting();
});

// アクティベート時
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 古いキャッシュを削除
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 新しいService Workerが全てのタブを制御
  self.clients.claim();
});

// フェッチイベント
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // 画像リクエストは常にバイパス（ブラウザのデフォルト動作に任せる）
  if (event.request.destination === 'image') {
    return;
  }
  
  // APIリクエストの処理（TheMealDB以外）
  if (requestUrl.hostname === 'www.themealdb.com' && 
      requestUrl.pathname.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // TheMealDBの画像も直接取得
  if (requestUrl.hostname === 'www.themealdb.com') {
    return;
  }
  
  // その他のリクエスト（静的ファイル等）
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }
        
        // なければネットワークから取得
        return fetch(event.request).then(response => {
          // レスポンスが有効でない場合はそのまま返す
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // レスポンスをクローンしてキャッシュに保存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // オフライン時のフォールバック
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// APIリクエストの処理
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // ネットワークから最新データを取得
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // 成功したらキャッシュに保存
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('ネットワークエラー、キャッシュから取得:', error);
  }
  
  // ネットワークが失敗したらキャッシュから取得
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // キャッシュもない場合はエラーレスポンス
  return new Response(
    JSON.stringify({ 
      meals: [],
      error: 'オフラインです。インターネット接続を確認してください。'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// 画像リクエストの処理
async function handleImageRequest(request) {
  try {
    // まずネットワークから取得を試行（最新の画像を優先）
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // 成功したらキャッシュに保存
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('ネットワークから画像を取得できません、キャッシュを確認:', error);
  }
  
  // ネットワークが失敗した場合、キャッシュを確認
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // どちらも失敗した場合、リクエストをそのまま通す（Service Workerをバイパス）
  console.log('画像が見つかりません:', request.url);
  return fetch(request);
}

// バックグラウンド同期（将来的な機能拡張用）
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // バックグラウンドでデータを同期
  console.log('バックグラウンド同期を実行');
}

// プッシュ通知（将来的な機能拡張用）
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : '新しいレシピが追加されました！',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('レシピアプリ', options)
  );
});