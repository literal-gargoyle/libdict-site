import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { FileUp, Upload, X } from "lucide-react";

// Form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  sectionIdentifier: z.string(),
  termDefinitionSeparator: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConvertPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConvertPdfModal({ isOpen, onClose }: ConvertPdfModalProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      sectionIdentifier: "headings",
      termDefinitionSeparator: "colon",
    },
  });

  // PDF conversion mutation
  const convertMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      try {
        const response = await fetch("/api/convert-pdf", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to convert PDF");
        }

        return await response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/libraries"] });
      toast({
        title: "PDF Converted Successfully",
        description: `Your library "${data.title}" has been created.`,
      });
      resetForm();
      onClose();
      setTimeout(() => navigate(`/libraries/${data.id}`), 500);
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

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (!file) {
      toast({
        title: "File Required",
        description: "Please select a PDF file to convert.",
        variant: "destructive",
      });
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append("pdfFile", file);
    formData.append("title", values.title);
    formData.append("sectionIdentifier", values.sectionIdentifier);
    formData.append("termDefinitionSeparator", values.termDefinitionSeparator);

    convertMutation.mutate(formData);
  };

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
      if (!form.getValues().title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
        form.setValue("title", fileName);
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
      if (!form.getValues().title) {
        const fileName = droppedFile.name.replace(/\.[^/.]+$/, "");
        form.setValue("title", fileName);
      }
    }
  };

  // Prevent default behavior for drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Reset form
  const resetForm = () => {
    form.reset();
    setFile(null);
    setUploadProgress(0);
  };

  // Remove selected file
  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">Convert PDF to .libdict</DialogTitle>
          <DialogDescription>
            Upload a PDF file to convert it into a flashcard library
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter library title" 
                        {...field}
                        className="w-full rounded-lg border-gray-300 focus:ring-lib-primary focus:border-lib-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <FormLabel>Upload PDF</FormLabel>
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
                            indicatorClassName="bg-lib-primary-light" 
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
              
              <div>
                <FormLabel>PDF Structure</FormLabel>
                <div className="bg-lib-neutral-paper p-4 rounded-lg">
                  <p className="mb-4 text-sm">Define how terms and definitions are structured in your PDF:</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sectionIdentifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section Identifier</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="Select section identifier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="headings">Headings (H1, H2, etc.)</SelectItem>
                              <SelectItem value="bold">Bold text</SelectItem>
                              <SelectItem value="custom">Custom pattern</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="termDefinitionSeparator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Term-Definition Separator</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="Select separator" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="colon">Colon (:)</SelectItem>
                              <SelectItem value="dash">Dash (-)</SelectItem>
                              <SelectItem value="newline">New line</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={convertMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-lib-secondary hover:bg-lib-secondary-dark text-white"
                disabled={!file || convertMutation.isPending}
              >
                {convertMutation.isPending ? (
                  <div className="flex items-center">
                    <span className="mr-2">Converting</span>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  </div>
                ) : (
                  "Convert PDF"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
