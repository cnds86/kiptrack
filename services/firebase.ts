
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot,
  getDoc 
} from 'firebase/firestore';
import { Account, Transaction, SavingsGoal, Category, Currency, RecurringTransaction, Notification } from '../types';

// -----------------------------------------------------------
// 🟢 ขั้นตอนการตั้งค่า FIREBASE:
// 1. ไปที่ https://console.firebase.google.com/
// 2. สร้าง Project ใหม่ -> เลือก Web App (ไอคอน </>)
// 3. ก๊อปปี้ค่า firebaseConfig มาแทนที่ด้านล่างนี้
// 4. ไปที่เมนู Authentication -> Sign-in method -> เลือก Google -> กด Enable
// 5. ไปที่เมนู Firestore Database -> Create Database -> เลือก Start in Test Mode
// -----------------------------------------------------------

const firebaseConfig = {
  // 👇 ใส่ค่า Config ของคุณตรงนี้
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let app;
let auth: any;
let db: any;

try {
  // Check if config is dummy text
  if (firebaseConfig.apiKey !== "YOUR_API_KEY" && !firebaseConfig.apiKey.includes("YOUR_")) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("✅ Firebase initialized successfully");
  } else {
    console.warn("⚠️ Firebase Config missing: Running in Offline Mode.");
  }
} catch (e) {
  console.error("❌ Firebase Initialization Error:", e);
}

export const isFirebaseReady = () => !!auth;

export const loginWithGoogle = async () => {
  if (!auth) {
      alert("กรุณาตั้งค่า Firebase Config ในไฟล์ services/firebase.ts ก่อนใช้งาน");
      return;
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

export const logout = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null); 
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// --- Database Types ---
export interface AppData {
  accounts: Account[];
  transactions: Transaction[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  currencies: Currency[];
  goals: SavingsGoal[];
  recurringTransactions: RecurringTransaction[];
  notifications: Notification[];
}

// Save all data to Firestore
export const saveUserDataToCloud = async (userId: string, data: AppData) => {
  if (!db) return;
  try {
    const userRef = doc(db, 'users', userId);
    // Convert undefined to null for Firestore compatibility if needed, 
    // or just pass object. serializing dates might be needed if they aren't strings.
    await setDoc(userRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving to cloud:", error);
  }
};

// Load initial data once
export const loadUserDataFromCloud = async (userId: string): Promise<AppData | null> => {
    if (!db) return null;
    try {
        const userRef = doc(db, 'users', userId);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
            const data = snapshot.data() as AppData;
            return data;
        }
        return null;
    } catch (error) {
        console.error("Error loading from cloud:", error);
        return null;
    }
};

// Real-time listener
export const subscribeToUserData = (userId: string, callback: (data: AppData) => void) => {
  if (!db) return () => {};
  return onSnapshot(doc(db, 'users', userId), (doc) => {
    if (doc.exists()) {
      // We only callback if data exists to avoid wiping local state on fresh login
      callback(doc.data() as AppData);
    }
  });
};
