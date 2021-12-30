import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAW2yVxR3s5EdnGGWmQdGwwhIzXXUJH3xw",
  authDomain: "wp-clone-7f3ae.firebaseapp.com",
  projectId: "wp-clone-7f3ae",
  storageBucket: "wp-clone-7f3ae.appspot.com",
  messagingSenderId: "43020098328",
  appId: "1:43020098328:web:1c56f5cf866d1b72c65c6d",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = initializeFirestore(app, {
  experimentalLongForcePolling: true,
});

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}
