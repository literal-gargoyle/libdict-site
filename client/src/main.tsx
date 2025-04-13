import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add custom styles for LibDict
const style = document.createElement('style');
style.textContent = `
  :root {
    --primary: 210 64% 29%;
    --primary-foreground: 0 0% 100%;
    
    --secondary: 33 77% 54%;
    --secondary-foreground: 0 0% 100%;
    
    --background: 48 20% 95%;
    --foreground: 222 47% 11%;
    
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    
    --radius: 0.5rem;
    
    /* LibDict specific colors */
    --lib-primary: #1a4b77;
    --lib-primary-light: #427aa1;
    --lib-primary-dark: #0e3253;
    --lib-secondary: #e58a2d;
    --lib-secondary-light: #f0a14f;
    --lib-secondary-dark: #c06b15;
    --lib-neutral-paper: #f5f3eb;
    --lib-neutral-light: #f9f8f4;
    --lib-neutral-dark: #333333;
    --lib-success: #4caf50;
    --lib-error: #f44336;
  }

  body {
    font-family: 'Source Sans Pro', sans-serif;
    background-color: var(--lib-neutral-paper);
    color: var(--lib-neutral-dark);
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Merriweather', serif;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f5f3eb;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #427aa1;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #1a4b77;
  }

  /* Flashcard flip effect */
  .flashcard {
    perspective: 1000px;
  }
  
  .flashcard-inner {
    transform-style: preserve-3d;
    transition: transform 0.6s;
  }
  
  .flashcard.flipped .flashcard-inner {
    transform: rotateY(180deg);
  }
  
  .flashcard-front, .flashcard-back {
    backface-visibility: hidden;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .flashcard-back {
    transform: rotateY(180deg);
  }

  /* Animation classes */
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .animate-slide-up {
    animation: slideUp 0.5s ease-out;
  }
  
  .animate-flip {
    animation: flip 0.6s ease-in-out;
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  
  @keyframes slideUp {
    0% { transform: translateY(20px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes flip {
    0% { transform: rotateY(0deg); }
    50% { transform: rotateY(90deg); }
    100% { transform: rotateY(180deg); }
  }
`;

document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);
