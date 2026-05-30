import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAOpkbmmD0EIFYHbvKo3T9uo6U2mtfZsX0",
  authDomain: "nusantara-cctv.firebaseapp.com",
  projectId: "nusantara-cctv",
  storageBucket: "nusantara-cctv.firebasestorage.app",
  messagingSenderId: "280420708452",
  appId: "1:280420708452:web:cba6a574cce44128106f71",
  measurementId: "G-6D5P5HWPM0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export default app;
