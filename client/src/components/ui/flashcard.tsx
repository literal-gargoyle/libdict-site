import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export interface FlashcardProps {
  term: string;
  definition: string;
  section?: string;
  index?: number;
  total?: number;
  onFlip?: (isFlipped: boolean) => void;
  className?: string;
}

export function Flashcard({
  term,
  definition,
  section = "",
  index = 0,
  total = 0,
  onFlip,
  className,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (onFlip) onFlip(!isFlipped);
  };

  useEffect(() => {
    // Reset flipped state when card changes
    setIsFlipped(false);
  }, [term, definition]);

  return (
    <div 
      className={cn(
        "w-full h-64 sm:h-80 cursor-pointer relative flashcard",
        isFlipped && "flipped",
        className
      )}
      onClick={handleFlip}
    >
      <div className="flashcard-front absolute w-full h-full">
        <Card className="w-full h-full rounded-xl border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
          {section && (
            <span className="absolute top-4 left-4 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              {section}
            </span>
          )}
          {total > 0 && (
            <span className="absolute top-4 right-4 text-gray-400 text-sm">
              {index + 1}/{total}
            </span>
          )}
          <motion.h2 
            className="text-2xl sm:text-3xl font-medium text-gray-900 font-['Outfit']"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {term}
          </motion.h2>
          <p className="mt-4 text-sm text-gray-500">Click to reveal the meaning</p>
        </Card>
      </div>
      <div className="flashcard-back absolute w-full h-full">
        <Card className="w-full h-full rounded-xl border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
          {section && (
            <span className="absolute top-4 left-4 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              {section}
            </span>
          )}
          {total > 0 && (
            <span className="absolute top-4 right-4 text-gray-400 text-sm">
              {index + 1}/{total}
            </span>
          )}
          <motion.h2 
            className="text-2xl sm:text-3xl font-medium text-gray-900 font-['Outfit']"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {definition}
          </motion.h2>
          <p className="mt-4 text-sm text-gray-500">Click to go back</p>
        </Card>
      </div>
    </div>
  );
}
