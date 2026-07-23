import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

// Get firebase configuration, allowing custom config override from localStorage
let firebaseConfigToUse = firebaseConfig;
if (typeof window !== 'undefined') {
  const customConfigStr = localStorage.getItem('custom_firebase_config');
  if (customConfigStr) {
    try {
      firebaseConfigToUse = JSON.parse(customConfigStr);
    } catch (e) {
      console.warn('Failed to parse custom firebase config:', e);
    }
  }
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfigToUse) : getApp();

// Initialize Firebase App Check
if (typeof window !== 'undefined') {
  try {
    // Note: In production, replace with your actual reCAPTCHA v3 site key
    // initializeAppCheck(app, {
    //   provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_V3_SITE_KEY'),
    //   isTokenAutoRefreshEnabled: true
    // });
  } catch (err) {
    console.warn('App Check initialization failed:', err);
  }
}

// Initialize Firebase Auth
const auth = getAuth(app);

// Initialize Firestore with robust local offline cache persistence enabled automatically
let db;
try {
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, firebaseConfigToUse.firestoreDatabaseId || undefined);
} catch (e) {
  db = getFirestore(app, firebaseConfigToUse.firestoreDatabaseId || undefined);
}

// Initialize Storage
const storage = getStorage(app);
storage.maxUploadRetryTime = 15000;
storage.maxOperationRetryTime = 15000;

// Initialize Analytics (only works in browser)
let analytics = null;
const isUnconfigured = firebaseConfigToUse.projectId.startsWith('remixed-') || firebaseConfigToUse.apiKey.includes('mock');
if (typeof window !== 'undefined' && firebaseConfigToUse.measurementId && !isUnconfigured) {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    console.warn('Analytics initialization failed:', err);
  }
}

// Initialize Cloud Messaging (FCM)
let messaging = null;
if (typeof window !== 'undefined' && !isUnconfigured) {
  isMessagingSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

export { app, auth, db, storage, analytics, messaging };
