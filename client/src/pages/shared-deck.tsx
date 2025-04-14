import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Flashcard } from "@/components/ui/flashcard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Deck, Flashcard as FlashcardType, Section } from "@shared/schema";
import { Shuffle, ChevronLeft, ChevronRight, Copy, Save } from "lucide-react";
import { shuffleArray, downloadLibDict } from "@/lib/utils";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SharedDeckData {
  deck: Deck;
  sections: Section[];
  flashcards: Record<number, FlashcardType[]>;
  owner: {
    username: string;
    displayName: string | null;
  };
}

export default function SharedDeck() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const shareId = location.split("/")[2];
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [activeFlashcards, setActiveFlashcards] = useState<FlashcardType[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<number | "all">("all");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const {
    data: deckData,
    isLoading,
    error,
  } = useQuery<SharedDeckData>({
    queryKey: [`/api/shared/${shareId}`],
    enabled: !!shareId,
  });

  useEffect(() => {
    if (deckData) {
      // Initialize flashcards
      updateActiveFlashcards(deckData, "all");
    }
  }, [deckData]);

  const updateActiveFlashcards = (
    data: SharedDeckData | undefined,
    sectionId: number | "all"
  ) => {
    if (!data) return;
    
    let cards: FlashcardType[] = [];
    
    if (sectionId === "all") {
      // Get cards from all sections
      Object.values(data.flashcards).forEach(sectionCards => {
        cards = [...cards, ...sectionCards];
      });
    } else if (data.flashcards[sectionId as number]) {
      cards = [...data.flashcards[sectionId as number]];
    }
    
    setActiveFlashcards(cards);
    setCurrentCardIndex(0);
  };

  const handleSectionChange = (sectionId: string) => {
    const newSectionId = sectionId === "all" ? "all" : parseInt(sectionId);
    setActiveSectionId(newSectionId);
    updateActiveFlashcards(deckData, newSectionId);
  };

  const handleShuffle = () => {
    setActiveFlashcards(shuffleArray(activeFlashcards));
    setCurrentCardIndex(0);
    
    toast({
      title: "Cards shuffled",
      description: "The flashcards have been randomly shuffled",
    });
  };

  const handlePrevious = () => {
    setCurrentCardIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentCardIndex(prev => Math.min(activeFlashcards.length - 1, prev + 1));
  };

  const handleSaveToLibrary = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    // This would be implemented with an API call in a real app
    toast({
      title: "Deck saved",
      description: "This deck has been added to your library",
    });
  };

  const handleDownload = () => {
    if (!deckData) return;
    
    // Create .libdict format
    const libDictData = {
      format_version: "1.0",
      title: deckData.deck.title,
      sections: {} as Record<string, Array<{ term: string; definition: string }>>
    };
    
    // Organize flashcards by section
    deckData.sections.forEach(section => {
      const sectionCards = deckData.flashcards[section.id] || [];
      libDictData.sections[section.name] = sectionCards.map(card => ({
        term: card.term,
        definition: card.definition
      }));
    });
    
    // Download the file
    downloadLibDict(libDictData, `${deckData.deck.title.toLowerCase().replace(/\s+/g, '-')}.libdict`);
    
    toast({
      title: "Download started",
      description: "Your .libdict file is being downloaded",
    });
  };

  const getSectionName = (sectionId: number): string => {
    if (!deckData) return "";
    const section = deckData.sections.find(s => s.id === sectionId);
    return section ? section.name : "";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-5 w-32 mt-1" />
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
              
              <Skeleton className="h-12 w-full mb-8" />
              
              <div className="max-w-lg mx-auto mb-8">
                <Skeleton className="h-64 sm:h-80 w-full rounded-xl" />
                
                <div className="flex items-center justify-between mt-6">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !deckData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200 max-w-4xl mx-auto text-center">
              <h3 className="text-xl font-bold text-red-800 mb-2">Shared Deck Not Found</h3>
              <p className="text-red-700 mb-4">
                This shared deck doesn't exist or has been removed by its owner.
              </p>
              <Button onClick={() => setLocation("/")}>
                Return to Home
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${deckData.deck.title} - Shared Deck - LibDict`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto">
              {/* Study session header */}
              <div className="flex flex-col mb-6">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center">
                    <h3 className="text-xl font-bold text-gray-900 font-['Outfit']">{deckData.deck.title}</h3>
                    <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Shared Deck
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Created by {deckData.owner.displayName || deckData.owner.username}
                  </p>
                  <Badge variant="outline" className="mt-2 bg-primary-50 text-primary-600 border-primary-200 whitespace-nowrap inline-flex">
                    {Object.values(deckData.flashcards).flat().length} cards
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShuffle}
                    className="flex items-center"
                  >
                    <Shuffle className="mr-1.5 h-4 w-4" /> Shuffle
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveToLibrary}
                    className="flex items-center"
                  >
                    <Save className="mr-1.5 h-4 w-4" /> Save to Library
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/shared/${shareId}`;
                      navigator.clipboard.writeText(shareUrl);
                      toast({
                        title: "Share link copied",
                        description: "The share link has been copied to your clipboard",
                      });
                    }}
                    className="flex items-center"
                  >
                    <Copy className="mr-1.5 h-4 w-4" /> Copy Share Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="flex items-center"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="mr-1.5 h-4 w-4"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" x2="12" y1="15" y2="3" />
                    </svg> 
                    Download
                  </Button>
                </div>
              </div>

              {deckData.deck.description && (
                <div className="mb-6 p-3 bg-primary-50 rounded-md text-sm text-gray-700">
                  {deckData.deck.description}
                </div>
              )}

              {/* Section tabs */}
              <div className="max-w-lg mx-auto w-full">
                <Tabs 
                  defaultValue="all" 
                  value={activeSectionId.toString()}
                  onValueChange={handleSectionChange}
                  className="mb-8 w-full"
                >
                  <div className="relative w-full overflow-hidden">
                    <TabsList className="flex w-full h-auto overflow-x-auto pb-px border-b border-gray-200 scrollbar-hide">
                      <div className="flex min-w-full">
                        <TabsTrigger
                          value="all"
                          className="px-4 py-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary shrink-0 flex-none"
                        >
                          All Sections
                        </TabsTrigger>
                        {deckData.sections.map(section => (
                          <TabsTrigger
                            key={section.id}
                            value={section.id.toString()}
                            className="px-4 py-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary whitespace-nowrap shrink-0 flex-none"
                          >
                            {section.name}
                          </TabsTrigger>
                        ))}
                      </div>
                    </TabsList>
                  </div>
                </Tabs>
              </div>

              {/* Flashcard container */}
              <div className="max-w-lg mx-auto mb-8">
                {activeFlashcards.length > 0 ? (
                  <Flashcard
                    term={activeFlashcards[currentCardIndex].term}
                    definition={activeFlashcards[currentCardIndex].definition}
                    section={getSectionName(activeFlashcards[currentCardIndex].sectionId)}
                    index={currentCardIndex}
                    total={activeFlashcards.length}
                  />
                ) : (
                  <div className="w-full h-64 sm:h-80 flex flex-col items-center justify-center text-center bg-white rounded-xl shadow-md border border-gray-200 p-8">
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No flashcards available</h3>
                    <p className="text-gray-600">
                      There are no flashcards in this section.
                    </p>
                  </div>
                )}

                {activeFlashcards.length > 0 && (
                  <div className="flex items-center justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentCardIndex === 0}
                      className="flex items-center"
                    >
                      <ChevronLeft className="mr-1.5 h-4 w-4" /> Previous
                    </Button>
                    
                    <div className="text-sm text-gray-500">
                      Card {currentCardIndex + 1} of {activeFlashcards.length}
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleNext}
                      disabled={currentCardIndex === activeFlashcards.length - 1}
                      className="flex items-center"
                    >
                      Next <ChevronRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Total cards info */}
              <div className="max-w-lg mx-auto text-center text-sm text-gray-500">
                This deck contains {Object.values(deckData.flashcards).flat().length} total flashcards 
                across {deckData.sections.length} different sections.
              </div>
            </div>
          </div>
        </main>
        <Footer />
        
        {/* Login Prompt Dialog */}
        <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign in to save this deck</AlertDialogTitle>
              <AlertDialogDescription>
                You need to be signed in to save this deck to your library.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => setLocation("/sign-in")}>
                Sign In
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
