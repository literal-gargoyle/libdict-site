import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Flashcard } from "@/components/ui/flashcard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Deck, Flashcard as FlashcardType, Section } from "@shared/schema";
import { Shuffle, ChevronLeft, ChevronRight, Check, X, Filter } from "lucide-react";
import { shuffleArray } from "@/lib/utils";
import { Helmet } from "react-helmet";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface DeckData {
  deck: Deck;
  sections: Section[];
  flashcards: Record<number, FlashcardType[]>;
  progress: {
    correct: number;
    total: number;
  };
}

export default function StudyDeck() {
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const deckId = location.split("/")[2];
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [activeFlashcards, setActiveFlashcards] = useState<FlashcardType[]>([]);
  const [correctCards, setCorrectCards] = useState<number[]>([]);
  const [incorrectCards, setIncorrectCards] = useState<number[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<number | "all">("all");
  const [enabledSections, setEnabledSections] = useState<number[]>([]);

  const {
    data: deckData,
    isLoading,
    error,
  } = useQuery<DeckData>({
    queryKey: [`/api/decks/${deckId}/study`],
    enabled: !!user && !!deckId,
  });

  const updateProgressMutation = useMutation({
    mutationFn: (data: { correct: boolean; flashcardId: number }) => {
      return apiRequest("POST", `/api/decks/${deckId}/progress`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/study`] });
    },
  });

  useEffect(() => {
    // Redirect if not logged in
    if (!authLoading && !user) {
      setLocation("/sign-in");
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    if (deckData) {
      // Initialize enabled sections
      const sectionIds = deckData.sections.map(section => section.id);
      setEnabledSections(sectionIds);
      
      // Initialize flashcards
      updateActiveFlashcards(deckData, "all", sectionIds);
    }
  }, [deckData]);

  const updateActiveFlashcards = (
    data: DeckData | undefined,
    sectionId: number | "all",
    sections: number[]
  ) => {
    if (!data) return;
    
    let cards: FlashcardType[] = [];
    
    if (sectionId === "all") {
      // Get cards from all enabled sections
      sections.forEach(secId => {
        if (data.flashcards[secId]) {
          cards = [...cards, ...data.flashcards[secId]];
        }
      });
    } else if (data.flashcards[sectionId as number]) {
      cards = [...data.flashcards[sectionId as number]];
    }
    
    // Remove cards that have been marked as correct
    const remainingCards = cards.filter(card => !correctCards.includes(card.id));
    
    setActiveFlashcards(remainingCards);
    setCurrentCardIndex(0);
  };

  const handleSectionChange = (sectionId: string) => {
    const newSectionId = sectionId === "all" ? "all" : parseInt(sectionId);
    setActiveSectionId(newSectionId);
    updateActiveFlashcards(deckData, newSectionId, enabledSections);
  };

  const toggleSectionEnabled = (sectionId: number) => {
    let newEnabledSections: number[];
    
    if (enabledSections.includes(sectionId)) {
      newEnabledSections = enabledSections.filter(id => id !== sectionId);
    } else {
      newEnabledSections = [...enabledSections, sectionId];
    }
    
    setEnabledSections(newEnabledSections);
    updateActiveFlashcards(deckData, activeSectionId, newEnabledSections);
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

  const handleCorrect = () => {
    if (activeFlashcards.length === 0) return;
    
    const currentCard = activeFlashcards[currentCardIndex];
    updateProgressMutation.mutate({ correct: true, flashcardId: currentCard.id });
    
    setCorrectCards([...correctCards, currentCard.id]);
    
    // Remove card from active flashcards
    const newActiveFlashcards = activeFlashcards.filter(card => card.id !== currentCard.id);
    setActiveFlashcards(newActiveFlashcards);
    
    // Adjust currentCardIndex if needed
    if (currentCardIndex >= newActiveFlashcards.length) {
      setCurrentCardIndex(Math.max(0, newActiveFlashcards.length - 1));
    }
    
    toast({
      title: "Marked as correct",
      description: "This card has been removed from the current session",
    });
  };

  const handleIncorrect = () => {
    if (activeFlashcards.length === 0) return;
    
    const currentCard = activeFlashcards[currentCardIndex];
    updateProgressMutation.mutate({ correct: false, flashcardId: currentCard.id });
    
    setIncorrectCards([...incorrectCards, currentCard.id]);
    
    // Move to next card
    handleNext();
    
    toast({
      title: "Marked as incorrect",
      description: "The card will remain in your study session",
      variant: "destructive",
    });
  };

  const getSectionName = (sectionId: number): string => {
    if (!deckData) return "";
    const section = deckData.sections.find(s => s.id === sectionId);
    return section ? section.name : "";
  };

  const progressPercentage = deckData 
    ? Math.round((deckData.progress.correct / deckData.progress.total) * 100) || 0
    : 0;

  const sessionProgressPercentage = 
    deckData && deckData.progress.total > 0 
      ? Math.round((correctCards.length / deckData.progress.total) * 100)
      : 0;

  if (authLoading || isLoading) {
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
                  <div className="flex space-x-3">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
              
              <div className="max-w-lg mx-auto">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
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
              <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Deck</h3>
              <p className="text-red-700 mb-4">
                We couldn't load this deck. It might not exist or you may not have permission to view it.
              </p>
              <Button onClick={() => setLocation("/my-library")}>
                Return to Library
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
        <title>{`Studying: ${deckData.deck.title} - LibDict`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto">
              {/* Study session header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-['Outfit']">{deckData.deck.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Session progress: {correctCards.length}/{deckData.progress.total} cards
                  </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShuffle}
                    className="flex items-center"
                  >
                    <Shuffle className="mr-1.5 h-4 w-4" /> Shuffle
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                      >
                        <Filter className="mr-1.5 h-4 w-4" /> Sections
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {deckData.sections.map(section => (
                        <DropdownMenuCheckboxItem
                          key={section.id}
                          checked={enabledSections.includes(section.id)}
                          onCheckedChange={() => toggleSectionEnabled(section.id)}
                        >
                          {section.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

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
                    <h3 className="text-xl font-medium text-gray-900 mb-2">All cards mastered!</h3>
                    <p className="text-gray-600 mb-6">
                      You've successfully gone through all the flashcards in this session.
                    </p>
                    <Button onClick={() => setLocation("/my-library")}>
                      Return to Library
                    </Button>
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
                    
                    <div className="flex space-x-3">
                      <Button
                        variant="destructive"
                        onClick={handleIncorrect}
                        className="flex items-center"
                      >
                        <X className="mr-1.5 h-4 w-4" /> Incorrect
                      </Button>
                      <Button
                        variant="default"
                        onClick={handleCorrect}
                        className="flex items-center bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-1.5 h-4 w-4" /> Correct
                      </Button>
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

              {/* Progress bar */}
              <div className="max-w-lg mx-auto">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>Session Progress</span>
                  <span>
                    {correctCards.length}/{deckData.progress.total} cards ({sessionProgressPercentage}%)
                  </span>
                </div>
                <Progress value={sessionProgressPercentage} className="h-2.5" />
                
                <div className="flex items-center justify-between text-sm text-gray-500 mt-4 mb-2">
                  <span>Overall Mastery</span>
                  <span>
                    {deckData.progress.correct}/{deckData.progress.total} cards ({progressPercentage}%)
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2.5" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
