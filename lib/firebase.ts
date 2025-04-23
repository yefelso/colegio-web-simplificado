import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyA5-BA-ckgyXElqSObBU92pJkIsjVM3sm4",
  authDomain: "ma-proyect.firebaseapp.com",
  projectId: "ma-proyect",
  storageBucket: "ma-proyect.firebasestorage.app",
  messagingSenderId: "157425423284",
  appId: "1:157425423284:web:3b19e0401b849e4ca998e1",
  measurementId: "G-GLSJYQ68GC",
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db }
