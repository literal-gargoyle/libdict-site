import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Spinner({ className, size = "md" }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <Loader2 
      className={cn(
        "animate-spin text-primary", 
        sizeClasses[size],
        className
      )} 
    />
  );
}

export function LoadingSpinner({ 
  message = "Loading...", 
  className 
}: { 
  message?: string; 
  className?: string 
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-2", className)}>
      <Spinner size="lg" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}