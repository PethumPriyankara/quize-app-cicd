
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBbrnZRBfuSZXquI6X8uiEW_D8usdh5jDU",
  authDomain: "quiz-it-33cb6.firebaseapp.com",
  projectId: "quiz-it-33cb6",
  storageBucket: "quiz-it-33cb6.firebasestorage.app",
  messagingSenderId: "835502918462",
  appId: "1:835502918462:web:90d30c21b7a946f4143a6f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export default app;
