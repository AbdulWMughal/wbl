// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { enableIndexedDbPersistence } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBARWwAZPViP4Bh2I_01jApr-G5hFJd7Dw",
  authDomain: "wbl1-baecf.firebaseapp.com",
  projectId: "wbl1-baecf",
  storageBucket: "wbl1-baecf.firebasestorage.app",
  messagingSenderId: "1006966842883",
  appId: "1:1006966842883:web:3d00f06a86079309d6d036",
  measurementId: "G-Y1XF21C6LZ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const storage = getStorage();
export const db = getFirestore();


enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn("Persistence failed: multiple tabs open");
  } else if (err.code === 'unimplemented') {
    console.warn("Persistence not supported by browser");
  }
});