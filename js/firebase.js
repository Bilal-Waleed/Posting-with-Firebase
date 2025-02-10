import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, limit, orderBy, serverTimestamp, addDoc, onSnapshot, deleteDoc, updateDoc} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAY3oN9rlK_ogexKnmCky72EFt2nvNC-AM",
  authDomain: "login-signup-e9f13.firebaseapp.com",
  projectId: "login-signup-e9f13",
  storageBucket: "login-signup-e9f13.firebasestorage.app",
  messagingSenderId: "547900056943",
  appId: "1:547900056943:web:71e0b8f65b4502352e749a",
  measurementId: "G-EDTCX180VT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy, 
  serverTimestamp,
  addDoc,
  onSnapshot,
  deleteDoc,
  updateDoc
};
