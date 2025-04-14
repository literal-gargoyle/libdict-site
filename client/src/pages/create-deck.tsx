import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LibDictFile } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, FileText, Edit, FileJson } from "lucide-react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";

type CreationMethod = "pdf-upload" | "manual-entry" | "import-json";

export default function CreateDeck() {
  const { user, loading: authLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [creationMethod, setCreationMethod] = useState<CreationMethod>("import-json");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!authLoading && !user) {
      setLocation("/sign-in");
    }
  }, [user, authLoading, setLocation]);

  const createDeckMutation = useMutation({
    mutationFn: (formData: FormData) => {
      return apiRequest("POST", "/api/decks", undefined, { formData });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Deck created",
        description: "Your new deck has been created successfully",
      });
      
      // Get the method from the variables (the passed FormData)
      const method = variables.get('method') as string;
      if (method === 'manual-entry') {
        // Redirect to manual entry page with the deck ID
        setLocation(`/manual-entry/${data.id}`);
      } else {
        // Default redirect to library
        setLocation("/my-library");
      }
    },
    onError: (error) => {
      toast({
        title: "Error creating deck",
        description: error.message || "Failed to create deck. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory("");
    }
  };

  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter((c) => c !== category));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleCreateDeck = () => {
    if (!title) {
      toast({
        title: "Missing title",
        description: "Please provide a title for your deck",
        variant: "destructive",
      });
      return;
    }

    if (creationMethod === "pdf-upload" && !selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (creationMethod === "import-json" && !selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a .libdict file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description || "");
    formData.append("categories", JSON.stringify(categories));
    formData.append("method", creationMethod);
    
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    console.log("Creating deck with form data:", {
      title,
      description,
      categories,
      method: creationMethod,
      fileSelected: !!selectedFile,
      fileName: selectedFile?.name
    });

    // If manual entry, handle it differently
    if (creationMethod === "manual-entry") {
      createDeckMutation.mutate(formData, {
        onSuccess: (data) => {
          // Redirect to manual entry page with the deck ID
          setLocation(`/manual-entry/${data.id}`);
        }
      });
      return;
    }

    createDeckMutation.mutate(formData);
  };

  return (
    <>
      <Helmet>
        <title>Create Deck - LibDict</title>
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-2xl font-bold text-gray-900 font-['Outfit']">Create a New Deck</h3>
                <p className="mt-2 text-gray-600">
                  Build your own flashcard deck or upload a PDF to automatically generate cards.
                </p>
                
                <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">File Format</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    The .libdict format organizes cards by sections, making it easy to study specific topics.
                  </p>
                  <div className="bg-gray-100 p-3 rounded-md overflow-x-auto text-xs">
                    <pre className="text-gray-800">{
`{
  "format_version": "1.0",
  "title": "My Deck",
  "sections": {
    "nouns": [
      {
        "term": "example",
        "definition": "definition"
      }
    ]
  }
}`
                    }</pre>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 md:mt-0 md:col-span-2">
                <Card>
                  <CardContent className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6">
                        <Label htmlFor="deck-title">Deck Title</Label>
                        <Input
                          id="deck-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g., Latin Vocabulary"
                          className="mt-1"
                        />
                      </div>

                      <div className="col-span-6">
                        <Label htmlFor="deck-description">Description (Optional)</Label>
                        <Textarea
                          id="deck-description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Brief description of your deck..."
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div className="col-span-6">
                        <Label>Categories</Label>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {categories.map((category) => (
                            <Badge key={category} variant="outline" className="bg-primary-100 text-primary-800">
                              {category}
                              <button
                                type="button"
                                onClick={() => handleRemoveCategory(category)}
                                className="ml-1 inline-flex text-primary-500 focus:outline-none"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          <div className="flex">
                            <Input
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              placeholder="Add new category"
                              className="h-8 text-sm"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddCategory();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleAddCategory}
                              className="ml-2"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-6">
                        <Label>Creation Method</Label>
                        <RadioGroup
                          value={creationMethod}
                          onValueChange={(value) => setCreationMethod(value as CreationMethod)}
                          className="mt-1 space-y-4"
                        >
                          <div className={`relative bg-white rounded-lg border ${creationMethod === "import-json" ? "border-primary ring-2 ring-primary" : "border-gray-300"} shadow-sm px-6 py-4 cursor-pointer hover:border-primary`}>
                            <RadioGroupItem
                              value="import-json"
                              id="import-json"
                              className="sr-only"
                            />
                            <Label htmlFor="import-json" className="flex items-center cursor-pointer">
                              <span className="text-sm font-medium text-gray-900">Import .libdict File</span>
                              <Badge className="ml-2 bg-primary-100 text-primary-800 border-primary-200">
                                Recommended
                              </Badge>
                            </Label>
                            <span className="mt-1 flex items-center text-sm text-gray-500">
                              <FileJson className="mr-1.5 text-gray-400 h-4 w-4" />
                              Import an existing .libdict file (most reliable method)
                            </span>
                            <a 
                              href="https://github.com/literal-gargoyle/libdict" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-1 text-xs text-primary hover:underline flex items-center"
                            >
                              Visit GitHub repository for .libdict file creation
                            </a>
                          </div>

                          <div className={`relative bg-white rounded-lg border ${creationMethod === "pdf-upload" ? "border-primary ring-2 ring-primary" : "border-gray-300"} shadow-sm px-6 py-4 cursor-pointer hover:border-primary`}>
                            <RadioGroupItem
                              value="pdf-upload"
                              id="pdf-upload"
                              className="sr-only"
                            />
                            <Label htmlFor="pdf-upload" className="flex items-center cursor-pointer">
                              <span className="text-sm font-medium text-gray-900">Upload a PDF</span>
                            </Label>
                            <span className="mt-1 flex items-center text-sm text-gray-500">
                              <FileText className="mr-1.5 text-gray-400 h-4 w-4" />
                              Convert a PDF document into a structured flashcard deck (experimental)
                            </span>
                          </div>

                          <div className={`relative bg-white rounded-lg border ${creationMethod === "manual-entry" ? "border-primary ring-2 ring-primary" : "border-gray-300"} shadow-sm px-6 py-4 cursor-pointer hover:border-primary`}>
                            <RadioGroupItem
                              value="manual-entry"
                              id="manual-entry"
                              className="sr-only"
                            />
                            <Label htmlFor="manual-entry" className="flex items-center cursor-pointer">
                              <span className="text-sm font-medium text-gray-900">Manual Entry</span>
                            </Label>
                            <span className="mt-1 flex items-center text-sm text-gray-500">
                              <Edit className="mr-1.5 text-gray-400 h-4 w-4" />
                              Create and organize flashcards one by one
                            </span>
                            <span className="mt-1 text-xs text-gray-500">
                              For manual creation of sections and flashcards
                            </span>
                          </div>
                        </RadioGroup>
                      </div>

                      {(creationMethod === "pdf-upload" || creationMethod === "import-json") && (
                        <div className="col-span-6">
                          <div
                            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-primary/30 border-dashed rounded-xl hover:border-primary/60 transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                          >
                            <div className="space-y-3 text-center">
                              <Upload className="mx-auto h-12 w-12 text-primary" />
                              <div className="flex flex-col items-center text-sm text-gray-600">
                                <Button 
                                  variant="outline"
                                  className="relative overflow-hidden mb-2"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <span>Choose file</span>
                                  <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept={creationMethod === "pdf-upload" ? ".pdf" : ".libdict,.json"}
                                  />
                                </Button>
                                <p>or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                {creationMethod === "pdf-upload" ? "PDF up to 10MB" : ".libdict file"}
                              </p>
                              {selectedFile && (
                                <div className="text-sm font-medium text-primary mt-2 p-2 bg-primary/10 rounded-lg">
                                  Selected: {selectedFile.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
                    <Button
                      variant="outline"
                      className="mr-2"
                      onClick={() => setLocation("/my-library")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      onClick={handleCreateDeck}
                      disabled={createDeckMutation.isPending}
                    >
                      {createDeckMutation.isPending ? "Creating..." : "Create Deck"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
