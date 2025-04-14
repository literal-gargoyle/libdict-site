import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

export function HeroSection() {
  const { user } = useAuth();

  return (
    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 py-12 md:py-20 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="lg:w-1/2">
            <h1 className="text-4xl font-bold text-gray-900 font-['Outfit'] sm:text-5xl sm:tracking-tight lg:text-6xl">
              Learn <span className="text-primary">Anything.</span> <br/>
              Remember <span className="text-secondary">Everything.</span>
            </h1>
            <p className="mt-3 text-lg text-gray-600 sm:mt-5">
              A minimal yet powerful flashcard system for efficient studying. Create, share, and master new topics with LibDict's simple but effective learning tools.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row">
              {user ? (
                <>
                  <Link href="/create">
                    <Button className="inline-flex items-center px-6 py-3" size="lg">
                      Create Your First Deck
                      <Plus className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/my-library">
                    <Button 
                      variant="outline" 
                      className="mt-3 sm:mt-0 sm:ml-3 inline-flex items-center px-6 py-3 text-primary-700 bg-primary-100 hover:bg-primary-200"
                      size="lg"
                    >
                      Browse Library
                      <Search className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/sign-in">
                    <Button className="inline-flex items-center px-6 py-3" size="lg">
                      Get Started
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="ml-2 h-5 w-5"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="mt-10 lg:mt-0 lg:w-1/2 flex justify-center">
            <div className="relative w-72 md:w-96 h-64 md:h-80">
              {/* Decorative card stack with animations */}
              <motion.div 
                className="absolute top-6 right-4 w-48 h-36 bg-accent-400 rounded-lg shadow-lg z-10"
                initial={{ rotate: 12, opacity: 0 }}
                animate={{ rotate: 12, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
              <motion.div 
                className="absolute top-4 right-8 w-48 h-36 bg-secondary-400 rounded-lg shadow-lg z-20"
                initial={{ rotate: -6, opacity: 0 }}
                animate={{ rotate: -6, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
              <motion.div 
                className="absolute top-0 right-0 w-48 h-36 bg-primary-400 rounded-lg shadow-lg z-30"
                initial={{ rotate: 3, opacity: 0 }}
                animate={{ rotate: 3, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
              {/* Main card */}
              <motion.div 
                className="absolute bottom-0 left-0 w-56 h-40 bg-white rounded-lg shadow-xl z-40 p-4 flex flex-col justify-between"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div>
                  <div className="text-xs text-gray-500">Latin</div>
                  <div className="text-lg font-medium mt-1">centuriō, centuriōnis</div>
                </div>
                <div className="flex justify-end mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Noun
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
