import { useState } from "react";
import { Library } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Book, BookPlus, Search, Share2 } from "lucide-react";

interface SidebarProps {
  libraries: Library[];
  sharedLibraries: Library[];
}

export default function Sidebar({ libraries, sharedLibraries }: SidebarProps) {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter libraries based on search term
  const filteredLibraries = libraries.filter(library => 
    library.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredSharedLibraries = sharedLibraries.filter(library => 
    library.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get the number of cards in a library
  const getCardCount = (library: Library) => {
    if (!library.content || !library.content.sections) return 0;
    
    let count = 0;
    Object.values(library.content.sections).forEach(section => {
      count += section.length;
    });
    
    return count;
  };
  
  return (
    <aside className="hidden md:block w-64 bg-white shadow-md">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search libraries..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lib-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-grow p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">My Libraries</h2>
          
          {filteredLibraries.length > 0 ? (
            filteredLibraries.map(library => (
              <Link key={library.id} href={`/libraries/${library.id}`}>
                <a className={`flex items-center px-3 py-2 mb-2 rounded-lg text-neutral-dark hover:bg-lib-neutral-paper group transition-colors ${
                  location === `/libraries/${library.id}` ? 'bg-lib-neutral-paper' : ''
                }`}>
                  <Book className="mr-3 text-lib-primary" />
                  <span className="truncate">{library.title}</span>
                  <span className="ml-auto text-xs bg-lib-primary-light text-white rounded-full px-2 py-0.5">
                    {getCardCount(library)} cards
                  </span>
                </a>
              </Link>
            ))
          ) : libraries.length > 0 ? (
            <p className="text-sm text-gray-500 mb-4">No libraries match your search</p>
          ) : (
            <p className="text-sm text-gray-500 mb-4">No libraries yet</p>
          )}
          
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-4">Shared With Me</h2>
          
          {filteredSharedLibraries.length > 0 ? (
            filteredSharedLibraries.map(library => (
              <Link key={library.id} href={`/libraries/${library.id}`}>
                <a className={`flex items-center px-3 py-2 mb-2 rounded-lg text-neutral-dark hover:bg-lib-neutral-paper group transition-colors ${
                  location === `/libraries/${library.id}` ? 'bg-lib-neutral-paper' : ''
                }`}>
                  <Share2 className="mr-3 text-lib-secondary" />
                  <span className="truncate">{library.title}</span>
                  <span className="ml-auto text-xs bg-lib-secondary text-white rounded-full px-2 py-0.5">
                    {getCardCount(library)} cards
                  </span>
                </a>
              </Link>
            ))
          ) : sharedLibraries.length > 0 ? (
            <p className="text-sm text-gray-500 mb-4">No shared libraries match your search</p>
          ) : (
            <p className="text-sm text-gray-500 mb-4">No shared libraries yet</p>
          )}
          
          <Link href="/convert">
            <Button className="mt-6 w-full flex items-center justify-center px-4 py-2 bg-lib-primary text-white rounded-lg hover:bg-lib-primary-dark transition-colors">
              <BookPlus className="mr-2 h-4 w-4" />
              Create New Library
            </Button>
          </Link>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3">
            <span className="text-sm">Used: 230MB / 1GB</span>
            <span className="text-xs text-blue-600">Upgrade</span>
          </div>
          <Progress value={23} className="w-full h-2 mt-2 bg-gray-200" indicatorClassName="bg-lib-primary" />
        </div>
      </div>
    </aside>
  );
}
