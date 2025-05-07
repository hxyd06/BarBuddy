// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from 'firebase/functions';
import { getVertexAI, getGenerativeModel } from 'firebase/vertexai';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYbrOstXgo5golek9f37ty6zQ94CXzSnM",
  authDomain: "barbuddy-fc0b7.firebaseapp.com",
  projectId: "barbuddy-fc0b7",
  storageBucket: "barbuddy-fc0b7.firebasestorage.app",
  messagingSenderId: "688668097101",
  appId: "1:688668097101:web:3f425bf89105e630e8ba04"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Use standard auth for now to get your app working
const auth = getAuth(app);

// Export everything needed
export { auth };
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);
const vertexAI = getVertexAI(app);
export const model = getGenerativeModel(vertexAI, { model: 'gemini-1.5-flash' });
