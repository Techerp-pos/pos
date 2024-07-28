// src/utils/indexedDB.js
const dbName = 'ImageStore';
const storeName = 'images';

export const initDB = () => {
  const request = indexedDB.open(dbName, 1);

  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
    }
  };

  request.onerror = (event) => {
    console.error('Database error:', event.target.errorCode);
  };
};

export const saveImage = (imageData) => {
  const request = indexedDB.open(dbName, 1);

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.add({ imageData });
  };

  request.onerror = (event) => {
    console.error('Database error:', event.target.errorCode);
  };
};

export const getImages = (callback) => {
  const request = indexedDB.open(dbName, 1);

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const images = [];

    store.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        images.push(cursor.value);
        cursor.continue();
      } else {
        callback(images);
      }
    };
  };

  request.onerror = (event) => {
    console.error('Database error:', event.target.errorCode);
  };
};
