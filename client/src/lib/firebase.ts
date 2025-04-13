import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBxEWg6PC_NwI_Mxe7airdZuHGdTi9LCUw",
  authDomain: "libdict.firebaseapp.com",
  projectId: "libdict",
  storageBucket: "libdict.firebasestorage.app",
  messagingSenderId: "594833254780",
  appId: "1:594833254780:web:7e6dd9d4badeb68c089cf9",
  measurementId: "G-B20VX1QP8P"
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