import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { Deck, Flashcard, LibDictFile, Section, StudySession, User } from "@shared/schema";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Collection references
export const usersCollection = collection(db, "users");
export const decksCollection = collection(db, "decks");
export const sectionsCollection = collection(db, "sections");
export const flashcardsCollection = collection(db, "flashcards");
export const studySessionsCollection = collection(db, "studySessions");

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Firestore CRUD operations
export const createUser = async (user: User) => {
  try {
    await setDoc(doc(usersCollection, user.id.toString()), user);
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getUser = async (id: number) => {
  try {
    const docRef = doc(usersCollection, id.toString());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
    return undefined;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

export const getUserByFirebaseUid = async (firebaseUid: string) => {
  try {
    const q = query(usersCollection, where("firebaseUid", "==", firebaseUid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as User;
    }
    return undefined;
  } catch (error) {
    console.error("Error getting user by firebase UID:", error);
    throw error;
  }
};

export const updateUser = async (user: User) => {
  try {
    await updateDoc(doc(usersCollection, user.id.toString()), { ...user });
    return user;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const createDeck = async (deck: Deck) => {
  try {
    await setDoc(doc(decksCollection, deck.id.toString()), deck);
    return deck;
  } catch (error) {
    console.error("Error creating deck:", error);
    throw error;
  }
};

export const getDeck = async (id: number) => {
  try {
    const docRef = doc(decksCollection, id.toString());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Deck;
    }
    return undefined;
  } catch (error) {
    console.error("Error getting deck:", error);
    throw error;
  }
};

export const getDeckByShareId = async (shareId: string) => {
  try {
    const q = query(decksCollection, where("shareId", "==", shareId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as Deck;
    }
    return undefined;
  } catch (error) {
    console.error("Error getting deck by share ID:", error);
    throw error;
  }
};

export const updateDeck = async (deck: Deck) => {
  try {
    await updateDoc(doc(decksCollection, deck.id.toString()), { ...deck });
    return deck;
  } catch (error) {
    console.error("Error updating deck:", error);
    throw error;
  }
};

export const deleteDeck = async (id: number) => {
  try {
    await deleteDoc(doc(decksCollection, id.toString()));
  } catch (error) {
    console.error("Error deleting deck:", error);
    throw error;
  }
};

export const createSection = async (section: Section) => {
  try {
    await setDoc(doc(sectionsCollection, section.id.toString()), section);
    return section;
  } catch (error) {
    console.error("Error creating section:", error);
    throw error;
  }
};

export const getSectionsByDeckId = async (deckId: number) => {
  try {
    const q = query(sectionsCollection, where("deckId", "==", deckId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Section);
  } catch (error) {
    console.error("Error getting sections:", error);
    throw error;
  }
};

export const createFlashcard = async (flashcard: Flashcard) => {
  try {
    await setDoc(doc(flashcardsCollection, flashcard.id.toString()), flashcard);
    return flashcard;
  } catch (error) {
    console.error("Error creating flashcard:", error);
    throw error;
  }
};

export const getFlashcardsBySectionId = async (sectionId: number) => {
  try {
    const q = query(flashcardsCollection, where("sectionId", "==", sectionId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Flashcard);
  } catch (error) {
    console.error("Error getting flashcards:", error);
    throw error;
  }
};

export const getStudySession = async (userId: number, deckId: number) => {
  try {
    const q = query(
      studySessionsCollection, 
      where("userId", "==", userId),
      where("deckId", "==", deckId)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as StudySession;
    }
    return undefined;
  } catch (error) {
    console.error("Error getting study session:", error);
    throw error;
  }
};

export const createStudySession = async (session: StudySession) => {
  try {
    await setDoc(doc(studySessionsCollection, session.id.toString()), session);
    return session;
  } catch (error) {
    console.error("Error creating study session:", error);
    throw error;
  }
};

export const updateStudySession = async (session: StudySession) => {
  try {
    await updateDoc(doc(studySessionsCollection, session.id.toString()), { ...session });
    return session;
  } catch (error) {
    console.error("Error updating study session:", error);
    throw error;
  }
};

export { auth, app, db };
