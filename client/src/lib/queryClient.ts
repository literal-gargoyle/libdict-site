import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "./firebase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { formData?: FormData }
): Promise<T> {
  const currentUser = auth.currentUser;
  const firebaseUid = currentUser?.uid;
  
  // Add firebase UID as query parameter
  const separator = url.includes('?') ? '&' : '?';
  const urlWithAuth = firebaseUid ? `${url}${separator}firebaseUid=${firebaseUid}` : url;
  
  if (options?.formData) {
    // For form data requests
    const res = await fetch(urlWithAuth, {
      method,
      body: options.formData,
      credentials: "include",
    });
    
    await throwIfResNotOk(res);
    return await res.json() as T;
  } else {
    // For JSON requests
    const res = await fetch(urlWithAuth, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    await throwIfResNotOk(res);
    return await res.json() as T;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const currentUser = auth.currentUser;
    const firebaseUid = currentUser?.uid;
    
    // Add firebase UID as query parameter
    const url = queryKey[0] as string;
    const separator = url.includes('?') ? '&' : '?';
    const urlWithAuth = firebaseUid ? `${url}${separator}firebaseUid=${firebaseUid}` : url;
    
    const res = await fetch(urlWithAuth, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
