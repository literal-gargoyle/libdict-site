import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { auth, signInWithGoogle, handleRedirectResult } from "@/lib/firebase";

type AuthContextType = {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: Error | null;
  googleSignInMutation: ReturnType<typeof useGoogleSignIn>;
  signOutMutation: ReturnType<typeof useSignOut>;
};

// Custom hook for Google Sign In
function useGoogleSignIn() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await signInWithGoogle();
      return null; // We'll handle the redirect result in the effect hook
    },
    onError: (error: Error) => {
      toast({
        title: "Google sign in failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Custom hook for Sign Out
function useSignOut() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await auth.signOut();
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  const googleSignInMutation = useGoogleSignIn();
  const signOutMutation = useSignOut();
  
  // Handle Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      },
      (authError) => {
        setError(authError as Error);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, []);
  
  // Handle redirect result when coming back from Google sign-in
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await handleRedirectResult();
        if (result?.user) {
          toast({
            title: "Sign in successful",
            description: `Welcome, ${result.user.displayName || "User"}!`,
          });
        }
      } catch (err) {
        console.error("Error processing redirect result:", err);
        toast({
          title: "Sign in failed",
          description: (err as Error).message,
          variant: "destructive",
        });
      }
    };
    
    if (!user && !loading) {
      checkRedirectResult();
    }
  }, [loading, toast, user]);
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: loading,
        error,
        googleSignInMutation,
        signOutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}