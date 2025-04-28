// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


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

// Initialize Firestore

export const db = getFirestore(app);