import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Section } from "@shared/schema";
import { Plus, X, Save, Book, Bookmark, Loader2 } from "lucide-react";

// Extended flashcard interface for temporary cards
interface ExtendedFlashcard {
  id: number;
  term: string;
  definition: string;
  sectionId: number;
  createdAt?: Date;
}

interface SectionWithCards {
  section: Section;
  flashcards: ExtendedFlashcard[];
}

interface DeckEditorProps {
  deckId: number;
  onComplete?: () => void;
}

export function DeckEditor({ deckId, onComplete }: DeckEditorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<SectionWithCards[]>([]);

  // Load sections and flashcards
  const { data: deckData } = useQuery({
    queryKey: [`/api/decks/${deckId}/study`]
  });

  // Handle data loading and errors
  useEffect(() => {
    if (deckData && typeof deckData === 'object') {
      const deckDataObj = deckData as Record<string, unknown>;
      if ('sections' in deckDataObj && 'flashcards' in deckDataObj) {
        const deckDataTyped = deckData as { sections: Section[], flashcards: Record<number, ExtendedFlashcard[]> };
        const formattedSections = deckDataTyped.sections.map((section: Section) => ({
          section,
          flashcards: deckDataTyped.flashcards[section.id] || [],
        }));
        setSections(formattedSections);
        setLoading(false);
      }
    }
  }, [deckData]);

  useEffect(() => {
    // If deck is new and has no sections yet, create a default one
    if (sections.length === 0 && !loading && deckData) {
      const defaultSection = {
        section: {
          id: 0, // Temporary ID
          name: "General",
          deckId,
          createdAt: new Date(),
        },
        flashcards: [
          {
            id: 0, // Temporary ID
            term: "",
            definition: "",
            sectionId: 0, // Temporary ID
            createdAt: new Date(),
          },
        ],
      };
      setSections([defaultSection]);
    }
  }, [loading, deckData, sections.length, deckId]);

  const createSectionMutation = useMutation({
    mutationFn: (name: string) => {
      return apiRequest("POST", `/api/decks/${deckId}/sections`, {
        name,
        deckId,
      });
    },
    onSuccess: (data) => {
      setSections([
        ...sections,
        {
          section: data,
          flashcards: [
            {
              id: 0, // Temporary ID
              term: "",
              definition: "",
              sectionId: data.id,
              createdAt: new Date(),
            },
          ],
        },
      ]);
      toast({
        title: "Section created",
        description: "New section has been added",
      });
    },
  });

  const createFlashcardMutation = useMutation({
    mutationFn: ({ term, definition, sectionId }: { term: string; definition: string; sectionId: number }) => {
      return apiRequest("POST", `/api/sections/${sectionId}/flashcards`, {
        term,
        definition,
        sectionId,
      });
    },
    onSuccess: (data, variables) => {
      setSections(
        sections.map((section) =>
          section.section.id === variables.sectionId
            ? {
                ...section,
                flashcards: [...section.flashcards.filter(card => card.id !== 0), data],
              }
            : section
        )
      );
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/study`] });
    },
  });

  const addSection = () => {
    createSectionMutation.mutate("New Section");
  };

  const addFlashcard = (sectionId: number) => {
    const sectionIdx = sections.findIndex((s) => s.section.id === sectionId);
    if (sectionIdx !== -1) {
      const updatedSections = [...sections];
      updatedSections[sectionIdx] = {
        ...updatedSections[sectionIdx],
        flashcards: [
          ...updatedSections[sectionIdx].flashcards,
          {
            id: -Date.now(), // Temporary negative ID to track unsaved cards
            term: "",
            definition: "",
            sectionId,
            createdAt: new Date(),
          },
        ],
      };
      setSections(updatedSections);
    }
  };

  const updateSectionName = (sectionId: number, name: string) => {
    setSections(
      sections.map((section) =>
        section.section.id === sectionId
          ? {
              ...section,
              section: {
                ...section.section,
                name,
              },
            }
          : section
      )
    );
  };

  const updateFlashcard = (sectionId: number, cardId: number, term: string, definition: string) => {
    setSections(
      sections.map((section) =>
        section.section.id === sectionId
          ? {
              ...section,
              flashcards: section.flashcards.map((card) =>
                card.id === cardId
                  ? {
                      ...card,
                      term,
                      definition,
                    }
                  : card
              ),
            }
          : section
      )
    );
  };

  const removeFlashcard = (sectionId: number, cardId: number) => {
    setSections(
      sections.map((section) =>
        section.section.id === sectionId
          ? {
              ...section,
              flashcards: section.flashcards.filter((card) => card.id !== cardId),
            }
          : section
      )
    );
  };

  const saveFlashcard = (sectionId: number, cardId: number) => {
    const sectionIdx = sections.findIndex((s) => s.section.id === sectionId);
    if (sectionIdx !== -1) {
      const card = sections[sectionIdx].flashcards.find((c) => c.id === cardId);
      if (card) {
        if (!card.term.trim() || !card.definition.trim()) {
          toast({
            title: "Incomplete flashcard",
            description: "Both term and definition must be filled out",
            variant: "destructive",
          });
          return;
        }

        createFlashcardMutation.mutate({
          term: card.term,
          definition: card.definition,
          sectionId,
        });
      }
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveAllFlashcards = async () => {
    // Get array of all valid flashcards that need to be saved
    const cardsToSave: Array<{sectionId: number, term: string, definition: string}> = [];
    
    sections.forEach((section) => {
      section.flashcards.forEach((card) => {
        // If card has a temporary ID (negative or zero) and has content
        if (card.id <= 0 && card.term.trim() && card.definition.trim()) {
          cardsToSave.push({
            term: card.term,
            definition: card.definition,
            sectionId: section.section.id,
          });
        }
      });
    });

    // If no cards to save, just complete
    if (cardsToSave.length === 0) {
      toast({
        title: "No changes to save",
        description: "No flashcards were modified",
      });
      
      if (onComplete) {
        onComplete();
      }
      return;
    }

    // Set saving state
    setIsSaving(true);

    // Show saving toast
    toast({
      title: "Saving flashcards",
      description: `Saving ${cardsToSave.length} flashcards...`,
    });

    // Save each card - using Promise.all to save them in parallel
    try {
      // Process cards in batches of 5 to avoid overwhelming the server
      const batchSize = 5;
      const batches = [];
      
      // Split cards into batches
      for (let i = 0; i < cardsToSave.length; i += batchSize) {
        batches.push(cardsToSave.slice(i, i + batchSize));
      }
      
      // Process each batch sequentially
      let savedCount = 0;
      for (const batch of batches) {
        const batchPromises = batch.map(cardData => 
          createFlashcardMutation.mutateAsync(cardData)
        );
        
        await Promise.all(batchPromises);
        savedCount += batch.length;
        
        // Update progress
        if (batches.length > 1) {
          toast({
            title: "Saving progress",
            description: `Saved ${savedCount} of ${cardsToSave.length} flashcards...`,
          });
        }
      }
      
      // Only show success message after all cards are saved
      toast({
        title: "Deck saved",
        description: `Successfully saved ${cardsToSave.length} flashcards`,
      });

      // Invalidate the deck data query to refresh it
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/study`] });
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      toast({
        title: "Error saving flashcards",
        description: "There was an error saving some flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading deck content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Edit Deck Content</h2>
        <Button onClick={saveAllFlashcards} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-col space-y-4">
        {sections.map((section) => (
          <Card key={section.section.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <Book className="mr-2 h-5 w-5 text-primary" />
                <Input
                  value={section.section.name}
                  onChange={(e) => updateSectionName(section.section.id, e.target.value)}
                  className="text-lg font-bold border-none px-0 py-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Section Name"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {section.flashcards.map((card) => (
                  <div 
                    key={card.id} 
                    className="flex flex-col space-y-2 p-3 border rounded-md"
                  >
                    <div className="flex items-center">
                      <Bookmark className="mr-2 h-4 w-4 text-primary" />
                      <Input
                        value={card.term}
                        onChange={(e) => updateFlashcard(section.section.id, card.id, e.target.value, card.definition)}
                        className="font-medium"
                        placeholder="Term"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFlashcard(section.section.id, card.id)}
                        className="ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={card.definition}
                      onChange={(e) => updateFlashcard(section.section.id, card.id, card.term, e.target.value)}
                      className="min-h-[80px]"
                      placeholder="Definition"
                    />
                    {card.id <= 0 && (
                      <Button 
                        size="sm" 
                        onClick={() => saveFlashcard(section.section.id, card.id)}
                        disabled={!card.term.trim() || !card.definition.trim()}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Card
                      </Button>
                    )}
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => addFlashcard(section.section.id)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Flashcard
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button 
        variant="secondary" 
        className="w-full" 
        onClick={addSection}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Section
      </Button>

      <div className="flex justify-end mt-4">
        <Button onClick={saveAllFlashcards} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save and Continue
            </>
          )}
        </Button>
      </div>
    </div>
  );
}