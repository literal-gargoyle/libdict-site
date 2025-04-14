import { Link } from "wouter";
import { Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <Link href="/">
            <span className="font-['Outfit'] font-bold text-2xl text-primary cursor-pointer">
              📚 Lib<span className="text-secondary">Dict</span>
            </span>
          </Link>
        </div>
        <nav className="mt-8 flex flex-wrap justify-center" aria-label="Footer">
          <div className="px-5 py-2">
            <a href="#" className="text-gray-500 hover:text-gray-900">
              About
            </a>
          </div>
          <div className="px-5 py-2">
            <a href="#" className="text-gray-500 hover:text-gray-900">
              Features
            </a>
          </div>
          <div className="px-5 py-2">
            <a href="#" className="text-gray-500 hover:text-gray-900">
              FAQs
            </a>
          </div>
          <div className="px-5 py-2">
            <a href="#" className="text-gray-500 hover:text-gray-900">
              Contact
            </a>
          </div>
        </nav>
        <div className="mt-8 flex justify-center space-x-6">
          <a
            href="https://github.com/literal-gargoyle/libdict"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">GitHub</span>
            <Github className="h-6 w-6" />
          </a>
          <a
            href="https://github.com/literal-gargoyle/libdict-site"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">GitHub</span>
            <Github className="h-6 w-6" />
          </a>
        </div>
        <p className="mt-8 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} LibDict. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
