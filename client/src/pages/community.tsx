import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Search, BookOpen, Users, Calendar, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CommunityDeck {
  id: number;
  title: string;
  description: string | null;
  isPublic: boolean;
  shareId: string;
  createdAt: string;
  owner: {
    username: string;
    displayName: string | null;
  };
  sectionCount: number;
  cardCount: number;
}

export default function Community() {
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: communityDecks = [], isLoading } = useQuery<CommunityDeck[]>({
    queryKey: ["/api/community-decks"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filteredDecks = communityDecks.filter(deck => 
    deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (deck.description && deck.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    deck.owner.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Community Decks - LibDict</title>
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow bg-gray-50 py-8 sm:py-12 px-2 sm:px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Community Decks</h1>
              <p className="text-gray-600 max-w-2xl mx-auto px-2 sm:px-0 text-sm sm:text-base">
                Explore and study decks shared by the LibDict community. Find decks created by others or share your own with the world.
              </p>
            </div>

            <div className="relative mb-6 w-full max-w-xl mx-auto px-4 sm:px-0">
              <Search className="absolute left-7 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search decks..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-6 sm:right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden bg-white animate-pulse h-64">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredDecks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No decks found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery ? "Try a different search term or browse all decks." : "There are no community decks available yet."}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {filteredDecks.map((deck) => (
                  <Card key={deck.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="text-center mb-3">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">{deck.title}</h3>
                        <Badge variant="outline" className="mt-2 bg-primary-50 text-primary-600 border-primary-200 whitespace-nowrap inline-flex">
                          {deck.cardCount} cards
                        </Badge>
                      </div>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2 text-center">
                        {deck.description || "No description provided"}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <Users className="mr-1.5 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{deck.owner.displayName || deck.owner.username}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <BookOpen className="mr-1.5 h-4 w-4 flex-shrink-0" />
                        <span>{deck.sectionCount} {deck.sectionCount === 1 ? "section" : "sections"}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="mr-1.5 h-4 w-4 flex-shrink-0" />
                        <span>Created {formatDate(new Date(deck.createdAt))}</span>
                      </div>
                    </CardContent>
                    <Separator />
                    <CardFooter className="p-3 sm:p-4 bg-gray-50 flex justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-gray-700 text-xs sm:text-sm"
                        onClick={() => window.open(`/shared/${deck.shareId}`, '_blank')}
                      >
                        <ArrowUpRight className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                        Preview
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        className="text-primary-600 text-xs sm:text-sm"
                        onClick={() => window.location.href = `/shared/${deck.shareId}`}
                      >
                        <Download className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                        Study
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}