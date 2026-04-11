// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBs0tIr7HhJlTTck1HwqfIzxlACKDdVg-0",
  authDomain: "abandonedmap-823dd.firebaseapp.com",
  projectId: "abandonedmap-823dd",
  storageBucket: "abandonedmap-823dd.firebasestorage.app",
  messagingSenderId: "16482165307",
  appId: "1:16482165307:web:901b84695ccb1d8296b21e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);