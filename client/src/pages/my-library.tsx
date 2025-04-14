import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { DeckCard } from "@/components/ui/deck-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Deck, StudySession } from "@shared/schema";
import { Helmet } from "react-helmet";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface DeckWithData extends Deck {
  cardCount: number;
  studySession?: StudySession;
  categories?: string | string[]; // Categories can be stored as string or array
}

export default function MyLibrary() {
  const { user, loading: authLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingDeckId, setDeletingDeckId] = useState<number | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [currentShareUrl, setCurrentShareUrl] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect if not logged in
    if (!authLoading && !user) {
      setLocation("/sign-in");
    }
  }, [user, authLoading, setLocation]);

  const {
    data: decks,
    isLoading,
    error,
  } = useQuery<DeckWithData[]>({
    queryKey: ["/api/decks"],
    enabled: !!user,
  });

  const deleteDeckMutation = useMutation({
    mutationFn: (deckId: number) => {
      return apiRequest("DELETE", `/api/decks/${deckId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Deck deleted",
        description: "Your deck has been successfully deleted",
      });
    },
  });

  const shareDeckMutation = useMutation({
    mutationFn: (deckId: number) => {
      return apiRequest("POST", `/api/decks/${deckId}/share`, undefined);
    },
    onSuccess: (data: any) => {
      const shareUrl = `${window.location.origin}/shared/${data.shareId}`;
      setCurrentShareUrl(shareUrl);
      setShowShareDialog(true);
    },
  });
  
  const publishDeckMutation = useMutation({
    mutationFn: (deckId: number) => {
      return apiRequest("POST", `/api/decks/${deckId}/publish`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Deck published",
        description: "Your deck has been published to the community",
      });
    },
    onError: () => {
      toast({
        title: "Publishing failed",
        description: "There was an error publishing your deck to the community",
        variant: "destructive",
      });
    }
  });

  const handleDeleteDeck = (deckId: number) => {
    setDeletingDeckId(deckId);
  };

  const confirmDeleteDeck = () => {
    if (deletingDeckId) {
      deleteDeckMutation.mutate(deletingDeckId);
      setDeletingDeckId(null);
    }
  };

  const handleShareDeck = (deckId: number) => {
    shareDeckMutation.mutate(deckId);
  };
  
  const handlePublishDeck = (deckId: number) => {
    publishDeckMutation.mutate(deckId);
  };
  
  const handleEditDeck = (deckId: number) => {
    // Redirect to the manual entry editor for this deck
    setLocation(`/manual-entry/${deckId}`);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(currentShareUrl);
    toast({
      title: "Share link copied",
      description: "The link has been copied to your clipboard",
    });
  };

  const filteredDecks = decks?.filter(deck => {
    const searchLower = searchTerm.toLowerCase();
    return (
      deck.title.toLowerCase().includes(searchLower) ||
      (deck.description && deck.description.toLowerCase().includes(searchLower)) ||
      // Search in categories (as JSON string or as array)
      (deck.categories && (
        typeof deck.categories === 'string' 
          ? deck.categories.toLowerCase().includes(searchLower)
          : JSON.stringify(deck.categories).toLowerCase().includes(searchLower)
      ))
    );
  });

  // Group decks by recent and categories
  const recentDecks = filteredDecks?.filter(deck => 
    deck.studySession?.lastStudied
  ).sort((a, b) => {
    const dateA = a.studySession?.lastStudied ? new Date(a.studySession.lastStudied).getTime() : 0;
    const dateB = b.studySession?.lastStudied ? new Date(b.studySession.lastStudied).getTime() : 0;
    return dateB - dateA;
  }).slice(0, 4);

  // Example categories for visualization
  const categories = [
    { name: "Languages", count: filteredDecks?.length || 0, color: "primary" },
    { name: "Mathematics", count: 0, color: "secondary" },
    { name: "Computer Science", count: 0, color: "accent" },
    { name: "History", count: 0, color: "green" },
    { name: "Biology", count: 0, color: "purple" },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-80" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-64" />
              ))}
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
        <title>My Library - LibDict</title>
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-['Outfit']">My Library</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative w-full sm:w-64 md:w-80">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    className="pl-10 pr-4 py-2 w-full"
                    placeholder="Search decks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button className="inline-flex items-center justify-center" onClick={() => setLocation("/create")}>
                  <PlusIcon className="mr-1 h-5 w-5" /> New Deck
                </Button>
              </div>
            </div>

            {/* Recently Studied */}
            <div className="mb-12">
              <h3 className="text-lg font-medium text-gray-900 mb-4 font-['Outfit']">Recently Studied</h3>
              
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-64" />
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-50 p-4 rounded-md">
                  <p className="text-red-700">Error loading decks</p>
                </div>
              ) : recentDecks && recentDecks.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {recentDecks.map(deck => (
                    <DeckCard
                      key={deck.id}
                      deck={deck}
                      cardCount={deck.cardCount}
                      studySession={deck.studySession}
                      onDelete={handleDeleteDeck}
                      onShare={handleShareDeck}
                      onPublish={handlePublishDeck}
                      onEdit={handleEditDeck}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No decks studied yet</h3>
                  <p className="text-gray-500 mb-4">Create a new deck and start studying!</p>
                  <Button onClick={() => setLocation("/create")}>Create Your First Deck</Button>
                </div>
              )}
            </div>

            {/* All Decks */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 font-['Outfit']">All Decks</h3>
                {filteredDecks && filteredDecks.length > 0 && (
                  <div className="text-sm text-gray-500">
                    Showing {filteredDecks.length} deck{filteredDecks.length !== 1 ? 's' : ''}
                    {searchTerm && ` matching "${searchTerm}"`}
                  </div>
                )}
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-64" />
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-50 p-4 rounded-md">
                  <p className="text-red-700">Error loading decks</p>
                </div>
              ) : filteredDecks && filteredDecks.length > 0 ? (
                <div className="relative">
                  {/* Scroll container with fixed max height */}
                  <div className="overflow-y-auto pr-2 pb-2 max-h-[600px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 rounded-md">
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {filteredDecks.map(deck => (
                        <DeckCard
                          key={deck.id}
                          deck={deck}
                          cardCount={deck.cardCount}
                          studySession={deck.studySession}
                          onDelete={handleDeleteDeck}
                          onShare={handleShareDeck}
                          onPublish={handlePublishDeck}
                          onEdit={handleEditDeck}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Subtle gradient shadows to indicate scrollability */}
                  <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-12 bg-gradient-to-t from-gray-50 to-transparent"></div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No decks found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'No results match your search. Try different keywords.' : 'Create a new deck to get started!'}
                  </p>
                  <Button onClick={() => setLocation("/create")}>Create Deck</Button>
                </div>
              )}
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 font-['Outfit']">My Categories</h3>
              <div className="flex flex-wrap gap-3">
                {categories.map((category, index) => (
                  <a 
                    key={index} 
                    href="#" 
                    className={`transition-all duration-300 section-pill inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-${category.color}-100 text-${category.color}-800 hover:bg-${category.color}-200`}
                  >
                    <span className={`w-2 h-2 bg-${category.color}-500 rounded-full mr-2`}></span>
                    {category.name} <span className={`ml-1.5 text-xs text-${category.color}-600`}>({category.count})</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deletingDeckId !== null} onOpenChange={() => setDeletingDeckId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the deck and all its flashcards. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteDeck} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Share Dialog */}
        <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Share your deck</AlertDialogTitle>
              <AlertDialogDescription>
                Anyone with this link can view and study this flashcard deck.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center space-x-2 mt-2">
              <Input value={currentShareUrl} readOnly onClick={(e) => e.currentTarget.select()} />
              <Button onClick={copyShareLink} variant="outline">Copy</Button>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction>Done</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
