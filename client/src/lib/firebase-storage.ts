import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from './firebase';
import { User } from 'firebase/auth';

/**
 * Helper function to generate a storage path for a user's file
 */
export function getUserFilePath(user: User, path: string): string {
  return `users/${user.uid}/${path}`;
}

/**
 * Upload a file to Firebase Storage
 * @param user - The authenticated user
 * @param file - The file to upload
 * @param path - The path to store the file (will be prefixed with user's ID)
 * @returns Promise with the download URL
 */
export async function uploadFile(user: User, file: File, path: string): Promise<string> {
  if (!user) throw new Error('User must be authenticated to upload files');
  
  const fullPath = getUserFilePath(user, path);
  const storageRef = ref(storage, fullPath);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Upload a PDF file and get its download URL
 * @param user - The authenticated user
 * @param file - The PDF file to upload
 * @param name - Optional name for the file (defaults to file name)
 * @returns Promise with the download URL
 */
export async function uploadPdfFile(user: User, file: File, name?: string): Promise<string> {
  const fileName = name || file.name;
  // Ensure the filename is clean and has .pdf extension
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9-_\.]/g, '_');
  const pdfFileName = cleanFileName.endsWith('.pdf') ? cleanFileName : `${cleanFileName}.pdf`;
  
  return uploadFile(user, file, `pdfs/${pdfFileName}`);
}

/**
 * Get the download URL for a file
 * @param user - The authenticated user
 * @param path - The path of the file
 * @returns Promise with the download URL
 */
export async function getFileUrl(user: User, path: string): Promise<string> {
  if (!user) throw new Error('User must be authenticated to get file URLs');
  
  const fullPath = getUserFilePath(user, path);
  const storageRef = ref(storage, fullPath);
  
  try {
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
}

/**
 * Delete a file from Firebase Storage
 * @param user - The authenticated user
 * @param path - The path of the file to delete
 */
export async function deleteFile(user: User, path: string): Promise<void> {
  if (!user) throw new Error('User must be authenticated to delete files');
  
  const fullPath = getUserFilePath(user, path);
  const storageRef = ref(storage, fullPath);
  
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * List all files in a directory
 * @param user - The authenticated user
 * @param directory - The directory to list
 * @returns Promise with the list of file references
 */
export async function listFiles(user: User, directory: string): Promise<string[]> {
  if (!user) throw new Error('User must be authenticated to list files');
  
  const fullPath = getUserFilePath(user, directory);
  const storageRef = ref(storage, fullPath);
  
  try {
    const result = await listAll(storageRef);
    // Get the download URLs for all items
    const urlPromises = result.items.map(itemRef => getDownloadURL(itemRef));
    return await Promise.all(urlPromises);
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}