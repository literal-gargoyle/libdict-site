import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, googleSignInMutation } = useAuth();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Handle Google Sign-In
  const handleGoogleSignIn = () => {
    googleSignInMutation.mutate();
  };
  
  return (
    <div className="flex min-h-screen bg-lib-neutral-paper">
      {/* Authentication Form */}
      <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center">
              <BookOpen className="h-14 w-14 text-lib-primary" />
              <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-lib-primary to-purple-400 text-transparent bg-clip-text ml-2">LibDict</h1>
            </div>
            <p className="mt-3 text-gray-600 text-lg">
              A playful library-based flashcard system
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6">Welcome!</h2>
            <p className="text-center mb-8 text-gray-600">
              Sign in with your Google account to start creating and studying flashcards.
            </p>
            
            <Button 
              onClick={handleGoogleSignIn}
              className="w-full py-6 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-lg shadow-sm transition-all hover:shadow-md"
              disabled={googleSignInMutation.isPending}
            >
              {googleSignInMutation.isPending ? (
                <div className="flex items-center">
                  <span className="mr-2">Signing in</span>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-lib-primary"></div>
                </div>
              ) : (
                <>
                  <FcGoogle className="h-6 w-6" />
                  <span className="text-lg">Sign in with Google</span>
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
      
      {/* Hero Section - Hidden on mobile */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-lib-primary to-purple-500 p-12 text-white flex flex-col justify-center">
        <div className="max-w-lg">
          <h2 className="text-4xl font-bold font-heading mb-6">Fun Studying with LibDict</h2>
          <p className="text-lg mb-8">
            A playful yet powerful library-based flashcard system for efficient studying.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start bg-white/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="bg-white/20 p-2 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl">PDF to .libdict Conversion</h3>
                <p className="text-white/90">
                  Convert PDFs into lightweight, structured format optimized for fast loading and sharing.
                </p>
              </div>
            </div>
            
            <div className="flex items-start bg-white/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="bg-white/20 p-2 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl">Smart Shuffling</h3>
                <p className="text-white/90">
                  Shuffle cards randomly for better memory retention.
                </p>
              </div>
            </div>
            
            <div className="flex items-start bg-white/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="bg-white/20 p-2 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl">Cloud Sync</h3>
                <p className="text-white/90">
                  Keep your libraries and progress synced across all your devices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
