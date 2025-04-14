import fs from "fs";
import pdf from "pdf-parse";
import { LibDictFile } from "@shared/schema";

/**
 * Parses a PDF file and attempts to extract flashcard content organized by sections
 * @param filePath Path to the PDF file
 * @param title The title for the dictionary (derived from deck title)
 * @returns A LibDictFile object with sections and flashcards
 */
export async function parsePdfToLibdict(filePath: string, title: string): Promise<LibDictFile> {
  // Read the PDF file
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdf(dataBuffer);
  
  // Extract the text content
  const text = pdfData.text;
  
  // Parse the content into sections
  // This is a simple implementation and may need to be adjusted based on actual PDF structure
  const libdictData: LibDictFile = {
    format_version: "1.0",
    title: title,
    sections: {}
  };
  
  // Split text into lines and process
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  // Attempt to detect sections and term-definition pairs
  let currentSection = "default";
  
  // Common section titles in language dictionaries
  const possibleSections = [
    "nouns", "verbs", "adjectives", "adverbs", "prepositions", 
    "conjunctions", "phrases", "vocabulary", "grammar"
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line is a section header
    const sectionMatch = possibleSections.find(section => 
      line.toLowerCase().includes(section) && line.length < 30
    );
    
    if (sectionMatch) {
      currentSection = sectionMatch;
      libdictData.sections[currentSection] = [];
      continue;
    }
    
    // Check if this line contains a term-definition pair
    // Common patterns: "term - definition" or "term : definition"
    let termDefMatch = line.match(/^(.+?)[\s]*[-:–—]\s*(.+)$/);
    
    if (termDefMatch) {
      // Initialize section if it doesn't exist
      if (!libdictData.sections[currentSection]) {
        libdictData.sections[currentSection] = [];
      }
      
      libdictData.sections[currentSection].push({
        term: termDefMatch[1].trim(),
        definition: termDefMatch[2].trim()
      });
      continue;
    }
    
    // If we have a term but next line might be the definition
    if (i < lines.length - 1 && line.length < 50 && !line.includes("-") && !line.includes(":")) {
      const potentialDefinition = lines[i + 1].trim();
      
      // If the next line looks like a definition (longer, not a section header)
      if (potentialDefinition.length > line.length && 
          !possibleSections.some(section => potentialDefinition.toLowerCase().includes(section))) {
        // Initialize section if it doesn't exist
        if (!libdictData.sections[currentSection]) {
          libdictData.sections[currentSection] = [];
        }
        
        libdictData.sections[currentSection].push({
          term: line,
          definition: potentialDefinition
        });
        
        // Skip the next line since we used it as definition
        i++;
      }
    }
  }
  
  // Ensure we have at least one section with content
  if (Object.keys(libdictData.sections).length === 0) {
    libdictData.sections = {
      vocabulary: []
    };
    
    // If no clear sections were detected, try to extract term-definition pairs
    // and put them in a default "vocabulary" section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip very short or very long lines
      if (line.length < 3 || line.length > 200) continue;
      
      // If the line contains a common separator
      if (line.includes("-") || line.includes(":") || line.includes("–")) {
        let termDefMatch = line.match(/^(.+?)[\s]*[-:–—]\s*(.+)$/);
        
        if (termDefMatch) {
          libdictData.sections.vocabulary.push({
            term: termDefMatch[1].trim(),
            definition: termDefMatch[2].trim()
          });
        }
      }
      // Try to pair consecutive lines as term and definition
      else if (i < lines.length - 1) {
        const nextLine = lines[i + 1].trim();
        
        // Skip if next line is too short
        if (nextLine.length < 3) continue;
        
        // If current line is shorter than next line, it might be a term
        if (line.length < nextLine.length && line.length < 50) {
          libdictData.sections.vocabulary.push({
            term: line,
            definition: nextLine
          });
          
          // Skip the next line
          i++;
        }
      }
    }
  }
  
  // If we still have no flashcards, create some sample cards from the content
  if (Object.values(libdictData.sections).flat().length === 0) {
    libdictData.sections = {
      "extracted_content": []
    };
    
    // Extract chunks of text to create flashcards
    const chunks = splitIntoChunks(text, 100);
    for (let i = 0; i < chunks.length; i += 2) {
      if (i + 1 < chunks.length) {
        libdictData.sections.extracted_content.push({
          term: chunks[i],
          definition: chunks[i + 1]
        });
      }
    }
  }
  
  return libdictData;
}

/**
 * Helper function to split text into chunks of approximately the specified length
 */
function splitIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  let currentChunk = "";
  
  for (const word of words) {
    if ((currentChunk + " " + word).length <= chunkSize) {
      currentChunk += (currentChunk ? " " : "") + word;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = word;
      } else {
        // If a single word is longer than the chunk size
        chunks.push(word);
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}
