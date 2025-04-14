import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeckEditor } from "@/components/deck-editor";
import { Helmet } from "react-helmet";
import { Loader2 } from "lucide-react";
import { Deck } from "@shared/schema";

export default function ManualEntryPage() {
  const { user, loading: authLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const params = useParams();
  const deckId = params.id ? parseInt(params.id) : 0;
  const isEditMode = params.id !== undefined;

  // Fetch deck data if in edit mode
  const { data: deckData, isLoading: isDeckLoading } = useQuery<Deck>({
    queryKey: [`/api/decks/${deckId}`],
    enabled: isEditMode && deckId > 0, // Only fetch if we're in edit mode
  });

  useEffect(() => {
    // Redirect if not logged in
    if (!authLoading && !user) {
      setLocation("/sign-in");
    }
  }, [user, authLoading, setLocation]);

  const handleComplete = () => {
    setLocation(`/my-library`);
  };

  // Loading state
  if (isEditMode && isDeckLoading) {
    return (
      <>
        <Helmet>
          <title>Loading Deck | LibDict</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-grow bg-gray-50 py-8 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg text-gray-600">Loading deck content...</p>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  const deck = deckData as Deck | undefined;
  const pageTitle = isEditMode ? `Edit Deck: ${deck?.title || ""}` : "Create Your Flashcards";
  const pageDescription = isEditMode 
    ? "Edit your flashcards and sections to improve your study materials." 
    : "Add sections and flashcards to build your study deck. Each section can contain multiple flashcards.";

  return (
    <>
      <Helmet>
        <title>{isEditMode ? "Edit Deck" : "Create Deck"} | LibDict</title>
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow bg-gray-50 py-8">
          <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="pb-5 border-b border-gray-200 mb-6">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">{pageTitle}</h1>
              <p className="mt-2 max-w-4xl text-sm text-gray-500">
                {pageDescription}
              </p>
            </div>

            <div className="bg-white shadow rounded-lg p-4 sm:p-6">
              <DeckEditor deckId={deckId} onComplete={handleComplete} />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}