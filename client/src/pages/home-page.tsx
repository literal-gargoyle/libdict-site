import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/sidebar";
import MobileNav from "@/components/mobile-nav";
import UserNav from "@/components/user-nav";
import LibraryCard from "@/components/library-card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Library } from "@shared/schema";
import { BookOpenCheck, BookPlus, FileUp, Loader2, Sparkles } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  
  // Fetch user's libraries
  const { data: libraries, isLoading: isLoadingLibraries } = useQuery<Library[]>({
    queryKey: ["/api/libraries"],
  });
  
  // Fetch libraries shared with the user
  const { data: sharedLibraries, isLoading: isLoadingShared } = useQuery<Library[]>({
    queryKey: ["/api/shared-libraries"],
  });
  
  // Get user's display name
  const getDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || "Friend";
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-lib-neutral-paper">
      {/* Header */}
      <header className="bg-gradient-to-r from-lib-primary to-purple-500 shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpenCheck className="text-white text-2xl" />
            <h1 className="text-white font-heading font-bold text-xl md:text-2xl">LibDict</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <a className="text-white hover:text-white/70 transition-colors">Dashboard</a>
            </Link>
            <Link href="/">
              <a className="text-white hover:text-white/70 transition-colors">My Libraries</a>
            </Link>
            <Link href="/">
              <a className="text-white hover:text-white/70 transition-colors">Shared with Me</a>
            </Link>
            <Link href="/convert">
              <a className="text-white hover:text-white/70 transition-colors">Convert PDF</a>
            </Link>
          </nav>
          
          <UserNav user={user} />
        </div>
      </header>
      
      <div className="flex flex-grow">
        {/* Sidebar - Only visible on desktop */}
        <Sidebar libraries={libraries || []} sharedLibraries={sharedLibraries || []} />
        
        {/* Main Content */}
        <main className="flex-grow p-6 pb-16 md:pb-6">
          <div className="container mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-gradient-playful">
                Welcome, {getDisplayName()}! <Sparkles className="inline-block ml-2 text-yellow-400" />
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Your playful flashcard library for fun and efficient studying
              </p>
            </div>
            
            {/* Create Library Button */}
            <div className="mb-8 flex flex-wrap gap-4">
              <Link href="/convert">
                <Button className="btn-playful py-6 px-6 text-lg">
                  <FileUp className="mr-2 h-5 w-5" />
                  Convert PDF
                </Button>
              </Link>
              <Button className="py-6 px-6 text-lg bg-white hover:bg-gray-50 text-lib-primary border border-lib-primary/30 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
                <BookPlus className="mr-2 h-5 w-5" />
                Create Empty Library
              </Button>
            </div>
            
            {/* My Libraries Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-heading font-bold mb-4 flex items-center">
                <span className="text-gradient-playful">My Libraries</span>
              </h2>
              {isLoadingLibraries ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <div className="animate-float">
                    <Loader2 className="h-12 w-12 animate-spin text-lib-primary" />
                  </div>
                  <p className="mt-4 text-gray-600">Loading your libraries...</p>
                </div>
              ) : libraries && libraries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {libraries.map((library) => (
                    <LibraryCard key={library.id} library={library} />
                  ))}
                </div>
              ) : (
                <div className="card-playful p-10 rounded-xl text-center">
                  <div className="animate-float mb-6">
                    <BookOpenCheck className="h-16 w-16 mx-auto text-lib-primary mb-4" />
                  </div>
                  <h3 className="text-xl font-medium mb-3">No libraries yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Start by creating a new library or converting a PDF to begin your study journey!
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link href="/convert">
                      <Button className="btn-playful">
                        <FileUp className="mr-2 h-4 w-4" />
                        Convert PDF
                      </Button>
                    </Link>
                    <Button className="bg-white hover:bg-gray-50 text-lib-primary border border-lib-primary/30 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
                      <BookPlus className="mr-2 h-4 w-4" />
                      Create Library
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Shared With Me Section */}
            <div>
              <h2 className="text-2xl font-heading font-bold mb-4 flex items-center">
                <span className="text-gradient-playful">Shared With Me</span>
              </h2>
              {isLoadingShared ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <div className="animate-float">
                    <Loader2 className="h-12 w-12 animate-spin text-lib-primary" />
                  </div>
                  <p className="mt-4 text-gray-600">Loading shared libraries...</p>
                </div>
              ) : sharedLibraries && sharedLibraries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sharedLibraries.map((library) => (
                    <LibraryCard key={library.id} library={library} isShared />
                  ))}
                </div>
              ) : (
                <div className="card-playful p-10 rounded-xl text-center">
                  <div className="animate-float mb-6">
                    <BookOpenCheck className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  </div>
                  <h3 className="text-xl font-medium mb-3">No shared libraries</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    When someone shares a library with you, it will appear here for collaborative studying
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
