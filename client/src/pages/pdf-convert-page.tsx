import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import MobileNav from "@/components/mobile-nav";
import UserNav from "@/components/user-nav";
import { useQuery } from "@tanstack/react-query";
import { Library } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BookOpenCheck, FileUp, Upload, X, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { uploadPdfFile } from "@/lib/firebase-storage";

export default function PdfConvertPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [sectionIdentifier, setSectionIdentifier] = useState("headings");
  const [termDefinitionSeparator, setTermDefinitionSeparator] = useState("colon");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch user's libraries for sidebar
  const { data: libraries } = useQuery<Library[]>({
    queryKey: ["/api/libraries"],
  });
  
  // Fetch libraries shared with user for sidebar
  const { data: sharedLibraries } = useQuery<Library[]>({
    queryKey: ["/api/shared-libraries"],
  });

  // Mutation for PDF conversion
  const convertMutation = useMutation({
    mutationFn: async () => {
      if (!file || !title || !user) {
        throw new Error("File, title, and user authentication are required");
      }

      // First upload file to Firebase Storage
      try {
        // Show initial upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = prev + 5;
            return newProgress > 40 ? 40 : newProgress;
          });
        }, 200);
        
        // Upload PDF to Firebase Storage
        const fileUrl = await uploadPdfFile(user, file, title);
        clearInterval(progressInterval);
        setUploadProgress(50);
        
        // Create FormData object to send file URL and metadata
        const formData = new FormData();
        formData.append("pdfUrl", fileUrl);
        formData.append("title", title);
        formData.append("sectionIdentifier", sectionIdentifier);
        formData.append("termDefinitionSeparator", termDefinitionSeparator);

        // Show conversion progress
        const conversionInterval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = prev + 5;
            return newProgress > 90 ? 90 : newProgress;
          });
        }, 200);

        // Send the request
        const response = await fetch("/api/convert-pdf", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        clearInterval(conversionInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to convert PDF");
        }

        return await response.json();
      } catch (error) {
        console.error("Error during PDF conversion:", error);
        throw error;
      }
    },
    onSuccess: (data: Library) => {
      queryClient.invalidateQueries({ queryKey: ["/api/libraries"] });
      toast({
        title: "PDF Converted Successfully",
        description: `Your library "${data.title}" has been created.`,
      });
      setTimeout(() => navigate(`/libraries/${data.id}`), 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Conversion Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Check if file is a PDF
      if (selectedFile.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF file.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 50MB.",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
      
      // If no title is set, use the filename (without extension)
      if (!title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(fileName);
      }
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Check if file is a PDF
      if (droppedFile.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please drop a PDF file.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (max 50MB)
      if (droppedFile.size > 50 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 50MB.",
          variant: "destructive",
        });
        return;
      }
      
      setFile(droppedFile);
      
      // If no title is set, use the filename (without extension)
      if (!title) {
        const fileName = droppedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(fileName);
      }
    }
  };

  // Prevent default behavior for drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    convertMutation.mutate();
  };

  // Remove selected file
  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="flex flex-col min-h-screen bg-lib-neutral-paper">
      {/* Header */}
      <header className="bg-gradient-to-r from-lib-primary to-purple-500 shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpenCheck className="text-white text-2xl" />
            <h1 className="text-white font-heading font-bold text-xl md:text-2xl">LibDict</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <a className="text-white hover:text-white/70 transition-colors">Dashboard</a>
            </Link>
            <Link href="/">
              <a className="text-white hover:text-white/70 transition-colors">My Libraries</a>
            </Link>
            <Link href="/">
              <a className="text-white hover:text-white/70 transition-colors">Shared with Me</a>
            </Link>
            <Link href="/convert">
              <a className="text-white hover:text-white/70 transition-colors">Convert PDF</a>
            </Link>
          </nav>
          
          <UserNav user={user} />
        </div>
      </header>
      
      <div className="flex flex-grow">
        {/* Sidebar - Only visible on desktop */}
        <Sidebar libraries={libraries || []} sharedLibraries={sharedLibraries || []} />
        
        {/* Main Content */}
        <main className="flex-grow p-6 pb-16 md:pb-6">
          <div className="container mx-auto max-w-3xl">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-gradient-playful">
                Convert PDF to .libdict <Sparkles className="inline-block ml-2 text-yellow-400" />
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Upload a PDF file to magically transform it into a flashcard library
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <Label htmlFor="title" className="block text-sm font-semibold mb-2">
                    Library Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter library title"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-lib-primary focus:border-lib-primary"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <Label className="block text-sm font-semibold mb-2">Upload PDF</Label>
                  <div
                    className={`border-2 border-dashed ${
                      file ? 'border-lib-primary bg-lib-neutral-paper' : 'border-gray-300'
                    } rounded-lg p-8 text-center hover:bg-lib-neutral-paper transition-colors`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    {!file ? (
                      <div className="flex flex-col items-center">
                        <Upload className="h-12 w-12 text-lib-primary mb-2" />
                        <p className="mb-4">Drag & drop your PDF file here or click to browse</p>
                        <Button
                          type="button"
                          onClick={() => document.getElementById("pdfFile")?.click()}
                          className="bg-lib-primary hover:bg-lib-primary-dark text-white"
                        >
                          Browse Files
                        </Button>
                        <Input
                          id="pdfFile"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <p className="text-sm text-gray-500 mt-2">Maximum file size: 50MB</p>
                      </div>
                    ) : (
                      <div className="flex items-center p-3 bg-lib-neutral-paper rounded-lg">
                        <FileUp className="h-8 w-8 text-lib-error mr-3" />
                        <div className="flex-grow">
                          <div className="flex justify-between">
                            <span className="font-semibold">{file.name}</span>
                            <span className="text-sm text-gray-500">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                          {uploadProgress > 0 && (
                            <Progress 
                              value={uploadProgress} 
                              className="h-2 mt-2 bg-gray-200" 
                            />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                          className="ml-3 text-gray-500 hover:text-lib-error"
                          disabled={convertMutation.isPending}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mb-6">
                  <Label className="block text-sm font-semibold mb-2">PDF Structure</Label>
                  <div className="bg-lib-neutral-paper p-4 rounded-lg">
                    <p className="mb-4 text-sm">Define how terms and definitions are structured in your PDF:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sectionIdentifier" className="block text-sm mb-1">
                          Section Identifier
                        </Label>
                        <Select
                          value={sectionIdentifier}
                          onValueChange={setSectionIdentifier}
                        >
                          <SelectTrigger id="sectionIdentifier" className="w-full border border-gray-300">
                            <SelectValue placeholder="Select section identifier" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="headings">Headings (H1, H2, etc.)</SelectItem>
                            <SelectItem value="bold">Bold text</SelectItem>
                            <SelectItem value="custom">Custom pattern</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="termDefinitionSeparator" className="block text-sm mb-1">
                          Term-Definition Separator
                        </Label>
                        <Select
                          value={termDefinitionSeparator}
                          onValueChange={setTermDefinitionSeparator}
                        >
                          <SelectTrigger id="termDefinitionSeparator" className="w-full border border-gray-300">
                            <SelectValue placeholder="Select separator" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="colon">Colon (:)</SelectItem>
                            <SelectItem value="dash">Dash (-)</SelectItem>
                            <SelectItem value="newline">New line</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    className="bg-white hover:bg-gray-50 text-lib-primary border border-lib-primary/30 shadow-md hover:shadow-lg transition-all"
                    onClick={() => navigate("/")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="btn-playful px-6 py-6"
                    disabled={!file || !title || convertMutation.isPending}
                  >
                    {convertMutation.isPending ? (
                      <div className="flex items-center">
                        <span className="mr-2 text-lg">Converting</span>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <FileUp className="mr-2 h-5 w-5" />
                        <span className="text-lg">Convert PDF</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
