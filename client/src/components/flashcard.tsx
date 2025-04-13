import { useState } from "react";
import { FlashcardItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FlashcardProps {
  card: FlashcardItem;
  onCorrect?: () => void;
  onIncorrect?: () => void;
  showActions?: boolean;
}

export default function Flashcard({ card, onCorrect, onIncorrect, showActions = false }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  
  const handleFlip = () => {
    setFlipped(!flipped);
  };
  
  const handleCorrect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCorrect) onCorrect();
  };
  
  const handleIncorrect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onIncorrect) onIncorrect();
  };
  
  return (
    <div 
      className={`flashcard h-48 relative cursor-pointer ${flipped ? 'flipped' : ''}`} 
      onClick={handleFlip}
    >
      <div className="flashcard-inner h-full w-full">
        {/* Front of flashcard */}
        <div className="flashcard-front bg-white rounded-lg shadow-md p-6 flex flex-col justify-center items-center">
          <span className="absolute top-2 right-2 text-xs text-gray-500 capitalize">{card.section}</span>
          <h3 className="text-xl font-heading text-center">{card.term}</h3>
          <div className="mt-4 text-center text-sm text-gray-600">Click to reveal definition</div>
        </div>
        
        {/* Back of flashcard */}
        <div className="flashcard-back bg-lib-primary text-white rounded-lg shadow-md p-6 flex flex-col justify-center items-center">
          <span className="absolute top-2 right-2 text-xs text-white opacity-70 capitalize">{card.section}</span>
          <h3 className="text-xl font-heading text-center">{card.definition}</h3>
          
          {showActions && (
            <div className="mt-4 flex space-x-3">
              <Button 
                onClick={handleIncorrect}
                className="px-3 py-1 bg-lib-error rounded-md hover:bg-opacity-80 transition-colors"
                size="sm"
              >
                Incorrect
              </Button>
              <Button 
                onClick={handleCorrect}
                className="px-3 py-1 bg-lib-success rounded-md hover:bg-opacity-80 transition-colors"
                size="sm"
              >
                Correct
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
