/**
 * IndexedDB wrapper for storing refresh tokens.
 * IndexedDB is more resilient on iOS PWA than cookies or localStorage.
 * WebKit ITP won't evict IndexedDB data as aggressively.
 */

const DB_NAME = 'p2l_auth';
const STORE_NAME = 'session';
const TOKEN_KEY = 'refreshToken';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
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

export async function saveToken(refreshToken: string): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(refreshToken, TOKEN_KEY);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
        });
    } catch (e) {
        console.warn('[sessionDB] saveToken failed:', e);
    }
}

export async function getToken(): Promise<string | null> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).get(TOKEN_KEY);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => { db.close(); resolve(request.result || null); };
            request.onerror = () => { db.close(); reject(request.error); };
        });
    } catch (e) {
        console.warn('[sessionDB] getToken failed:', e);
        return null;
    }
}

export async function clearToken(): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(TOKEN_KEY);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
        });
    } catch (e) {
        console.warn('[sessionDB] clearToken failed:', e);
    }
}
