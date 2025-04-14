import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Link } from "wouter";
import { MoreHorizontal, ClockIcon, Layers, BarChart, Edit, Share, Trash2, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Deck, StudySession } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface DeckCardProps {
  deck: Deck;
  cardCount?: number;
  studySession?: StudySession;
  onShare?: (deckId: number) => void;
  onDelete?: (deckId: number) => void;
  onPublish?: (deckId: number) => void;
  onEdit?: (deckId: number) => void;
}

export function DeckCard({ 
  deck, 
  cardCount = 0,
  studySession,
  onShare,
  onDelete,
  onPublish,
  onEdit
}: DeckCardProps) {
  const { user } = useAuth();
  // We'll check if the user created this deck - we would need to match firebase UID
  // Since we don't have user ID in the auth user, we'll assume all decks can be edited
  const isOwnedByUser = true; // In a real implementation, we'd check deck.userId against the actual user ID
  
  const progress = studySession 
    ? Math.round((studySession.correctCount / studySession.totalCount) * 100) || 0
    : 0;

  const getStatusBadge = () => {
    if (!studySession) {
      return (
        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
          New
        </Badge>
      );
    }
    
    if (progress >= 80) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          Active
        </Badge>
      );
    } else if (progress > 0) {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          In Progress
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          Not Started
        </Badge>
      );
    }
  };

  return (
    <Card className="h-full overflow-hidden shadow hover:shadow-md transition duration-200">
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              {isOwnedByUser && onEdit && (
                <DropdownMenuItem onSelect={() => onEdit(deck.id)} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Deck
                </DropdownMenuItem>
              )}
              
              {onShare && (
                <DropdownMenuItem onSelect={() => onShare(deck.id)} className="cursor-pointer">
                  <Share className="mr-2 h-4 w-4" />
                  Share Deck
                </DropdownMenuItem>
              )}
              
              {onPublish && (
                <DropdownMenuItem onSelect={() => onPublish(deck.id)} className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Publish to Community
                </DropdownMenuItem>
              )}
              
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onSelect={() => onDelete(deck.id)} 
                    className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="text-center mb-3">
          {getStatusBadge()}
          <h3 className="mt-2 text-lg font-medium text-gray-900">{deck.title}</h3>
          <Badge variant="outline" className="mt-2 bg-primary-50 text-primary-600 border-primary-200 whitespace-nowrap inline-flex">
            {cardCount} cards
          </Badge>
        </div>
        {studySession && (
          <div className="flex items-center justify-center text-sm text-gray-500 mb-3">
            <ClockIcon className="mr-1.5 text-gray-400 h-4 w-4" />
            <span>Last studied {formatDate(studySession.lastStudied)}</span>
          </div>
        )}
        <div className="mt-4">
          <Progress value={progress} className="h-2.5" />
          <div className="mt-1 text-xs text-gray-500 text-right">{progress}% mastered</div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-4 sm:px-6 flex flex-wrap gap-2 justify-between">
        <div className="flex gap-4">
          <Link href={`/study/${deck.id}`}>
            <span className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/90 cursor-pointer">
              {progress > 0 ? "Continue" : "Start Studying"}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="ml-1 h-4 w-4"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </Link>
          
          {studySession && studySession.totalCount > 0 && (
            <Link href={`/analytics/${deck.id}`}>
              <span className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer">
                Analytics
                <BarChart className="ml-1 h-4 w-4" />
              </span>
            </Link>
          )}
        </div>
        
        <span className="text-xs text-gray-500">
          Updated {formatDate(deck.updatedAt)}
        </span>
      </CardFooter>
    </Card>
  );
}
