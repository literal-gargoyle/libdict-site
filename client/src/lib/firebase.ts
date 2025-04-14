import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Helper function to handle Google sign-in
export const signInWithGoogle = () => {
  return signInWithRedirect(auth, googleProvider);
};

// Helper function to handle the redirect result
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result;
  } catch (error) {
    console.error("Error during Google authentication: ", error);
    throw error;
  }
};