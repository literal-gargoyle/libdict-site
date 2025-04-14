/**
 * Generates a random share ID for deck sharing
 * @returns A random alphanumeric string
 */
export function createShareId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Extracts Firebase UID from request authorization header
 * @param authHeader The Authorization header from an HTTP request
 * @returns The Firebase UID or null if not present/valid
 */
export function extractFirebaseUid(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    // In a production app, you would verify the token 
    // with Firebase Admin SDK and extract the UID
    // This is just a placeholder for the structure
    return token || null;
  } catch (error) {
    console.error('Error extracting Firebase UID:', error);
    return null;
  }
}

/**
 * Sanitizes text by removing special characters, excess whitespace, etc.
 * @param text The text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Remove excess whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Remove potentially dangerous characters
  text = text.replace(/[<>&]/g, '');
  
  return text;
}

/**
 * Detects the language of a text string (simplified implementation)
 * @param text The text to analyze
 * @returns The detected language code or 'unknown'
 */
export function detectLanguage(text: string): string {
  // This is a very simple implementation
  // In a production app, you would use a proper language detection library
  
  // Check for common Latin characters
  if (/[áéíóúñ]/i.test(text)) {
    return 'es'; // Spanish
  } else if (/[àèìòù]/i.test(text)) {
    return 'it'; // Italian
  } else if (/[äöüß]/i.test(text)) {
    return 'de'; // German
  } else if (/[éèêëàçùïî]/i.test(text)) {
    return 'fr'; // French
  }
  
  // Default to English or unknown
  return 'en';
}
