const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/index.js',
    '/db.js',
    '/manifest.json',
];

const CACHE_NAME = 'static-cache-v2';
const DATA_CACHE_NAME = 'data-cache-v1';

// install the service worker 
self.addEventListener('install', function (evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Cached');
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// activate service worker and remove old data 
self.addEventListener('activate', function (evt) {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log('Removed', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// fetch requests 
self.addEventListener('fetch', function (evt) {
    if (evt.request.url.includes('/api/')) {
        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(evt.request)
                    .then(response => {
                        if (response.status === 200) {
                            cache.put(evt.request.url, response.clone());
                        }

                        return response;
                    })
                    .catch(err => {
                        return cache.match(evt.request);
                    });
            }).catch(err => console.log(err))
        );
        return;
    }
    evt.respondWith(
        fetch(evt.request).catch(function () {
            return caches.match(evt.request).then(function (response) {
                if (response) {
                    return response;
                } else if (evt.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/');
                }
            });
        })
    );
});