// Browser Local Storage / IndexedDB utility for Student Profile Images
// Ensures NO student images are ever uploaded to Firebase Storage or Firestore

const DB_NAME = 'EduERP_StudentImages';
const STORE_NAME = 'images';
const DB_VERSION = 1;

// In-memory cache for ultra-fast sync rendering
const imageMemoryCache = new Map<string, string>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a student image data URL locally in IndexedDB (with localStorage fallback).
 * Returns a local reference token.
 */
export async function saveLocalStudentImage(studentId: string, dataUrl: string): Promise<string> {
  if (!studentId || !dataUrl) return '';
  imageMemoryCache.set(studentId, dataUrl);

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(dataUrl, studentId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      localStorage.setItem(`edu_img_${studentId}`, dataUrl);
    } catch (e) {
      console.warn("Failed to store image in localStorage", e);
    }
  }

  return `local:${studentId}`;
}

/**
 * Get a student image data URL from IndexedDB/localStorage/memory cache.
 */
export async function getLocalStudentImage(studentId: string): Promise<string | null> {
  if (!studentId) return null;
  
  if (imageMemoryCache.has(studentId)) {
    return imageMemoryCache.get(studentId) || null;
  }

  try {
    const db = await openDB();
    const result = await new Promise<string | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(studentId);
      req.onsuccess = () => resolve((req.result as string) || null);
      req.onerror = () => resolve(null);
    });

    if (result) {
      imageMemoryCache.set(studentId, result);
      return result;
    }
  } catch (err) {
    // Fallback to localStorage
  }

  const localBackup = localStorage.getItem(`edu_img_${studentId}`);
  if (localBackup) {
    imageMemoryCache.set(studentId, localBackup);
    return localBackup;
  }

  return null;
}

/**
 * Get sync cached image if available
 */
export function getLocalStudentImageSync(studentId: string): string | null {
  if (!studentId) return null;
  if (imageMemoryCache.has(studentId)) {
    return imageMemoryCache.get(studentId) || null;
  }
  const localBackup = localStorage.getItem(`edu_img_${studentId}`);
  if (localBackup) {
    imageMemoryCache.set(studentId, localBackup);
    return localBackup;
  }
  return null;
}

/**
 * Delete a student image locally
 */
export async function deleteLocalStudentImage(studentId: string): Promise<void> {
  if (!studentId) return;
  imageMemoryCache.delete(studentId);
  localStorage.removeItem(`edu_img_${studentId}`);

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(studentId);
  } catch (e) {
    // ignore
  }
}
