import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7NcqdBNLhJGSO6bxNqq3YpGlHSKI5ydA",
  authDomain: "valorant-bingo.firebaseapp.com",
  projectId: "valorant-bingo",
  storageBucket: "valorant-bingo.firebasestorage.app",
  messagingSenderId: "192896877744",
  appId: "1:192896877744:web:bb28e3f7db9108798ae775",
  measurementId: "G-R1CNDXT9GY"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
