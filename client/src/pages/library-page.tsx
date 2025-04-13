import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/sidebar";
import MobileNav from "@/components/mobile-nav";
import UserNav from "@/components/user-nav";
import Flashcard from "@/components/flashcard";
import StudyMode from "@/components/study-mode";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Library, LibDict, FlashcardItem } from "@shared/schema";
import { Link } from "wouter";
import { BookOpenCheck, Download, Edit, Loader2, Share2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function LibraryPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [removeOnCorrect, setRemoveOnCorrect] = useState<boolean>(true);
  const [studyMode, setStudyMode] = useState<boolean>(false);
  
  // Fetch the library data
  const { data: library, isLoading: isLoadingLibrary } = useQuery<Library>({
    queryKey: ["/api/libraries", id],
  });
  
  // Fetch user's libraries for sidebar
  const { data: libraries } = useQuery<Library[]>({
    queryKey: ["/api/libraries"],
  });
  
  // Fetch libraries shared with user for sidebar
  const { data: sharedLibraries } = useQuery<Library[]>({
    queryKey: ["/api/shared-libraries"],
  });
  
  // Fetch study progress for this library
  const { data: studyProgress } = useQuery<{ mastered: string[] }>({
    queryKey: ["/api/study-progress", id],
  });
  
  // Process library content for display
  const getFlashcards = (): FlashcardItem[] => {
    if (!library?.content) return [];
    
    const content = library.content as LibDict;
    const cards: FlashcardItem[] = [];
    
    Object.entries(content.sections).forEach(([section, items]) => {
      if (selectedSection === "all" || selectedSection === section) {
        items.forEach(item => {
          cards.push({
            ...item,
            section
          });
        });
      }
    });
    
    return cards;
  };
  
  // Get section counts
  const getSectionCounts = (): Record<string, number> => {
    if (!library?.content) return {};
    
    const content = library.content as LibDict;
    const counts: Record<string, number> = {};
    
    Object.entries(content.sections).forEach(([section, items]) => {
      counts[section] = items.length;
    });
    
    return counts;
  };
  
  // Calculate total cards and mastered cards
  const getTotalAndMasteredCounts = () => {
    const flashcards = getFlashcards();
    const totalCards = flashcards.length;
    const masteredCards = studyProgress?.mastered?.length || 0;
    const masteredPercentage = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
    
    return { totalCards, masteredCards, masteredPercentage };
  };
  
  const { totalCards, masteredCards, masteredPercentage } = getTotalAndMasteredCounts();
  const sectionCounts = getSectionCounts();
  const flashcards = getFlashcards();
  
  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  if (isLoadingLibrary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-lib-primary" />
      </div>
    );
  }
  
  if (!library) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Library Not Found</h1>
          <Link href="/">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-lib-neutral-paper">
      {/* Header */}
      <header className="bg-lib-primary shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpenCheck className="text-white text-2xl" />
            <h1 className="text-white font-heading font-bold text-xl md:text-2xl">LibDict</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <a className="text-white hover:text-lib-secondary-light transition-colors">Dashboard</a>
            </Link>
            <Link href="/">
              <a className="text-white hover:text-lib-secondary-light transition-colors">My Libraries</a>
            </Link>
            <Link href="/">
              <a className="text-white hover:text-lib-secondary-light transition-colors">Shared with Me</a>
            </Link>
            <Link href="/convert">
              <a className="text-white hover:text-lib-secondary-light transition-colors">Convert PDF</a>
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
            {/* Library Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-lib-primary">
                  {library.title}
                </h1>
                <div className="flex space-x-3">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Share2 className="mr-2 h-4 w-4 text-lib-secondary" />
                    <span className="hidden md:inline">Share</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Download className="mr-2 h-4 w-4 text-lib-primary" />
                    <span className="hidden md:inline">Export</span>
                  </Button>
                  <Button variant="default" size="sm" className="bg-lib-primary hover:bg-lib-primary-dark text-white flex items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    <span className="hidden md:inline">Edit</span>
                  </Button>
                </div>
              </div>
              <p className="text-gray-600 mt-2">
                Created: {formatDate(library.createdAt)} • Last studied: {formatDate(library.lastStudiedAt)}
              </p>
            </div>
            
            {/* Library Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-heading font-semibold mb-2 text-lib-primary">Total Cards</h3>
                <div className="flex items-end">
                  <span className="text-3xl font-bold">{totalCards}</span>
                  <span className="ml-2 text-sm text-gray-500">cards</span>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span>Mastered</span>
                      <span className="font-semibold">{masteredCards} ({masteredPercentage}%)</span>
                    </div>
                    <Progress value={masteredPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-lib-success" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-heading font-semibold mb-2 text-lib-primary">Sections</h3>
                <div className="flex flex-col space-y-2">
                  {Object.entries(sectionCounts).filter(([_, count]) => count > 0).map(([section, count]) => (
                    <div key={section} className="flex justify-between items-center">
                      <span className="capitalize">{section}</span>
                      <span className="text-sm font-semibold bg-lib-primary-light text-white rounded-full px-2 py-0.5">
                        {count} cards
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-heading font-semibold mb-2 text-lib-primary">Study Progress</h3>
                <div className="flex items-end">
                  <span className="text-3xl font-bold">{totalCards - masteredCards}</span>
                  <span className="ml-2 text-sm text-gray-500">cards remaining</span>
                </div>
                <div className="mt-4 text-sm">
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span>Overall progress</span>
                      <span className="font-semibold">{masteredPercentage}%</span>
                    </div>
                    <Progress value={masteredPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-lib-primary-light" />
                  </div>
                  <Button 
                    className="w-full bg-lib-secondary hover:bg-lib-secondary-dark text-white"
                    onClick={() => setStudyMode(true)}
                  >
                    Continue Studying
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Study Options */}
            <div className="mb-8">
              <h2 className="text-xl font-heading font-bold mb-4">Study Options</h2>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Section Selection</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        onClick={() => setSelectedSection("all")} 
                        className={selectedSection === "all" 
                          ? "bg-lib-primary text-white hover:bg-lib-primary-dark" 
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-lib-neutral-paper"}
                      >
                        All Sections
                      </Button>
                      {Object.entries(sectionCounts).filter(([_, count]) => count > 0).map(([section, _]) => (
                        <Button 
                          key={section}
                          onClick={() => setSelectedSection(section)}
                          className={selectedSection === section 
                            ? "bg-lib-primary text-white hover:bg-lib-primary-dark" 
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-lib-neutral-paper"}
                        >
                          <span className="capitalize">{section}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Study Mode</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button className="bg-lib-primary text-white hover:bg-lib-primary-dark">
                        <i className="ri-shuffle-line mr-1"></i> Smart Shuffle
                      </Button>
                      <Button variant="outline">
                        <i className="ri-list-check-2 mr-1"></i> Sequential
                      </Button>
                      <Button variant="outline">
                        <i className="ri-error-warning-line mr-1"></i> Difficult Only
                      </Button>
                      <div className="flex items-center mt-2">
                        <Checkbox 
                          id="removeCorrect" 
                          checked={removeOnCorrect}
                          onCheckedChange={(checked) => setRemoveOnCorrect(checked as boolean)}
                          className="mr-2 data-[state=checked]:bg-lib-primary data-[state=checked]:border-lib-primary"
                        />
                        <label htmlFor="removeCorrect" className="text-sm">Remove cards on correct answer</label>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  className="mt-6 w-full py-3 bg-lib-secondary text-white hover:bg-lib-secondary-dark text-lg font-semibold"
                  onClick={() => setStudyMode(true)}
                >
                  Start Studying
                </Button>
              </div>
            </div>
            
            {/* Flashcard Preview */}
            <div>
              <h2 className="text-xl font-heading font-bold mb-4">Preview Cards</h2>
              {flashcards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {flashcards.slice(0, 3).map((card, index) => (
                    <Flashcard key={index} card={card} />
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <h3 className="text-lg font-medium mb-2">No cards available in this section</h3>
                  <p className="text-gray-500 mb-4">
                    Try selecting a different section or add cards to this library
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Study Mode Overlay */}
      {studyMode && (
        <StudyMode 
          library={library}
          selectedSection={selectedSection}
          removeOnCorrect={removeOnCorrect}
          onClose={() => setStudyMode(false)}
        />
      )}
    </div>
  );
}
