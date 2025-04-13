import { Library } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Book, Share2 } from "lucide-react";
import { Link } from "wouter";

interface LibraryCardProps {
  library: Library;
  isShared?: boolean;
}

export default function LibraryCard({ library, isShared = false }: LibraryCardProps) {
  // Calculate the total number of cards in the library
  const getTotalCardCount = () => {
    if (!library.content || !library.content.sections) return 0;
    
    let count = 0;
    Object.values(library.content.sections).forEach(section => {
      count += section.length;
    });
    
    return count;
  };
  
  const cardCount = getTotalCardCount();
  
  // Format the last studied date
  const getLastStudiedText = () => {
    if (!library.lastStudiedAt) return "Never studied";
    
    try {
      return `Studied ${formatDistanceToNow(new Date(library.lastStudiedAt), { addSuffix: true })}`;
    } catch (e) {
      return "Recently studied";
    }
  };
  
  return (
    <Link href={`/libraries/${library.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              {isShared ? (
                <div className="w-10 h-10 rounded-full bg-lib-secondary-light flex items-center justify-center mr-3">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-lib-primary-light flex items-center justify-center mr-3">
                  <Book className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg truncate max-w-[180px]">{library.title}</h3>
                <p className="text-sm text-gray-500">
                  {isShared ? "Shared with you" : "Your library"}
                </p>
              </div>
            </div>
            <span className="text-sm bg-lib-primary-light text-white rounded-full px-2 py-0.5">
              {cardCount} cards
            </span>
          </div>
        </CardContent>
        <CardFooter className="border-t p-4 text-xs text-gray-500">
          {getLastStudiedText()}
        </CardFooter>
      </Card>
    </Link>
  );
}
