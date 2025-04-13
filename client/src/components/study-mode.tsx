import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LibDict, Library, FlashcardItem } from "@shared/schema";
import { X, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StudyModeProps {
  library: Library;
  selectedSection: string;
  removeOnCorrect: boolean;
  onClose: () => void;
}

export default function StudyMode({ library, selectedSection, removeOnCorrect, onClose }: StudyModeProps) {
  const { toast } = useToast();
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studiedCount, setStudiedCount] = useState(0);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  
  // Fetch study progress
  const { data: progress } = useQuery<{ mastered: string[] }>({
    queryKey: ["/api/study-progress", library.id.toString()],
  });
  
  // Prepare cards for study
  useEffect(() => {
    if (!library.content) return;
    
    const content = library.content as LibDict;
    let allCards: FlashcardItem[] = [];
    
    Object.entries(content.sections).forEach(([section, items]) => {
      if (selectedSection === "all" || selectedSection === section) {
        items.forEach(item => {
          // Create unique ID for each card to track mastery
          const cardId = `${section}-${item.term}`;
          
          // Skip cards that are already mastered if removeOnCorrect is true
          if (removeOnCorrect && progress?.mastered?.includes(cardId)) {
            return;
          }
          
          allCards.push({
            ...item,
            section,
            id: cardId
          });
        });
      }
    });
    
    // Smart shuffle
    allCards = allCards.sort(() => Math.random() - 0.5);
    
    setCards(allCards);
    
    // Initialize mastered IDs from progress
    if (progress?.mastered) {
      setMasteredIds(progress.mastered);
    }
  }, [library, selectedSection, removeOnCorrect, progress]);
  
  // Update study progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (masteredIds: string[]) => {
      const res = await apiRequest("POST", "/api/study-progress", {
        libraryId: library.id,
        mastered: masteredIds
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-progress", library.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ["/api/libraries"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save progress",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle card flip
  const handleFlip = () => {
    setFlipped(!flipped);
  };
  
  // Handle correct answer
  const handleCorrect = () => {
    const currentCard = cards[currentCardIndex];
    
    // Add to mastered cards if not already
    if (!masteredIds.includes(currentCard.id)) {
      const newMasteredIds = [...masteredIds, currentCard.id];
      setMasteredIds(newMasteredIds);
      
      // Save progress
      updateProgressMutation.mutate(newMasteredIds);
    }
    
    moveToNextCard();
  };
  
  // Handle incorrect answer
  const handleIncorrect = () => {
    moveToNextCard();
  };
  
  // Move to next card
  const moveToNextCard = () => {
    setStudiedCount(prev => prev + 1);
    
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setFlipped(false);
    } else {
      // Finished studying
      toast({
        title: "Study session completed!",
        description: `You've reviewed all ${cards.length} cards.`,
      });
      updateProgressMutation.mutate(masteredIds);
      onClose();
    }
  };
  
  // Progress percentage
  const progressPercentage = cards.length > 0 
    ? Math.round((studiedCount / cards.length) * 100) 
    : 0;
  
  return (
    <div className="fixed inset-0 bg-lib-primary bg-opacity-95 z-50">
      <div className="container mx-auto px-4 pt-6 pb-16 h-screen flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="text-white">
            <h2 className="text-xl font-heading font-bold">{library.title}</h2>
            <p className="text-sm opacity-80">
              Studying: {selectedSection === "all" ? "All Sections" : selectedSection} ({cards.length - currentCardIndex} cards remaining)
            </p>
          </div>
          <Button 
            variant="ghost" 
            className="text-white hover:text-lib-secondary hover:bg-transparent" 
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="relative flex-grow flex flex-col items-center justify-center">
          {/* Progress indicator */}
          <div className="absolute top-0 left-0 right-0">
            <div className="flex justify-between text-white text-sm mb-2">
              <span>Progress: {studiedCount}/{cards.length}</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2 bg-white bg-opacity-20" 
              indicatorClassName="bg-lib-secondary" 
            />
          </div>
          
          {/* Full size flashcard */}
          {cards.length > 0 ? (
            <div 
              className={`flashcard w-full max-w-2xl ${flipped ? 'flipped' : ''}`} 
              onClick={handleFlip}
            >
              <div className="flashcard-inner h-64 md:h-80">
                {/* Front of card */}
                <div className="flashcard-front bg-white rounded-lg shadow-lg p-8 flex flex-col justify-center items-center">
                  <span className="absolute top-4 right-4 text-sm text-gray-500 capitalize">
                    {cards[currentCardIndex].section}
                  </span>
                  <h3 className="text-3xl font-heading text-center">{cards[currentCardIndex].term}</h3>
                  <div className="mt-6 text-center text-gray-600">Click to reveal definition</div>
                </div>
                
                {/* Back of card */}
                <div className="flashcard-back bg-lib-primary-light text-white rounded-lg shadow-lg p-8 flex flex-col justify-center items-center">
                  <span className="absolute top-4 right-4 text-sm text-white opacity-70 capitalize">
                    {cards[currentCardIndex].section}
                  </span>
                  <h3 className="text-3xl font-heading text-center">{cards[currentCardIndex].definition}</h3>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-white text-center">
              <h3 className="text-2xl font-heading font-bold mb-4">No cards available</h3>
              <p className="text-lg opacity-80 mb-6">
                You've mastered all the cards in this section!
              </p>
              <Button 
                onClick={onClose}
                className="bg-lib-secondary hover:bg-lib-secondary-dark text-white px-6 py-2"
              >
                Return to Library
              </Button>
            </div>
          )}
          
          {/* Navigation buttons */}
          {cards.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-6 mb-4">
              <Button 
                className="px-6 py-3 bg-lib-error text-white rounded-lg hover:bg-opacity-80 transition-colors"
                onClick={handleIncorrect}
              >
                <X className="mr-2 h-5 w-5" />
                <span>Incorrect</span>
              </Button>
              
              {flipped ? (
                <Button 
                  className="px-6 py-3 bg-lib-success text-white rounded-lg hover:bg-opacity-80 transition-colors"
                  onClick={handleCorrect}
                >
                  <Check className="mr-2 h-5 w-5" />
                  <span>Correct</span>
                </Button>
              ) : (
                <Button 
                  className="px-6 py-3 bg-lib-primary-dark text-white rounded-lg hover:bg-opacity-80 transition-colors"
                  onClick={handleFlip}
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  <span>Reveal</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
