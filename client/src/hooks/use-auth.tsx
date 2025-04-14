import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, signInWithGoogle, logOut } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  level: number;
  experience: number;
  decksShared: number;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const userData: Partial<AuthUser> = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          level: 1,
          experience: 0,
          decksShared: 0
        };
        
        // Register/update user in our backend
        try {
          interface UserResponse {
            level: number;
            experience: number;
            decksShared: number;
          }
          
          const response = await apiRequest<UserResponse>("POST", "/api/auth/user", {
            firebaseUid: userData.uid,
            email: userData.email || "",
            username: userData.email || "",
            displayName: userData.displayName || "",
            photoURL: userData.photoURL || "",
          });
          
          // Update user data with values from backend
          if (response) {
            userData.level = response.level || 1;
            userData.experience = response.experience || 0;
            userData.decksShared = response.decksShared || 0;
          }
          
          setUser(userData as AuthUser);
        } catch (err) {
          console.error("Error syncing user with backend:", err);
          setUser(userData as AuthUser);
        }
      } else {
        // User is signed out
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await logOut();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
