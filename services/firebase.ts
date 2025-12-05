
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";

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
  apiKey: "AIzaSyA2cxFHiI5k8OYxKEM8lEhQoQ591lGA05w",
  authDomain: "kiptrack-baa44.firebaseapp.com",
  projectId: "kiptrack-baa44",
  storageBucket: "kiptrack-baa44.firebasestorage.app",
  messagingSenderId: "44896564718",
  appId: "1:44896564718:web:2422c2f3b0769e25884aff",
  measurementId: "G-XKR62PC7DH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
console.log("✅ Firebase initialized successfully");

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
    return () => { };
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

// Helper to remove undefined values (Firestore doesn't support undefined)
const removeUndefined = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj, (_, value) => value === undefined ? null : value));
};

// Save all data to Firestore
export const saveUserDataToCloud = async (userId: string, data: AppData) => {
  if (!db) return;
  try {
    console.log("📤 Saving to cloud...", { userId, transactionsCount: data.transactions?.length });
    const userRef = doc(db, 'users', userId);

    // Clean data - convert undefined to null for Firestore compatibility
    const cleanData = removeUndefined({
      ...data,
      lastUpdated: new Date().toISOString()
    });

    await setDoc(userRef, cleanData, { merge: true });
    console.log("✅ Saved to cloud successfully!");
  } catch (error) {
    console.error("❌ Error saving to cloud:", error);
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
export const subscribeToUserData = (userId: string, callback: (data: AppData | null) => void) => {
  if (!db) return () => { };
  console.log("📡 Starting Firestore listener for user:", userId);
  return onSnapshot(doc(db, 'users', userId), (doc) => {
    if (doc.exists()) {
      const data = doc.data() as AppData;
      console.log("📥 Received data from cloud:", { transactionsCount: data.transactions?.length });
      callback(data);
    } else {
      // Call with null for new users so the app knows Firestore check is complete
      console.log("📥 No existing data in cloud (new user)");
      callback(null);
    }
  });
};
