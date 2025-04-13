import { Link, useLocation } from "wouter";
import { BookOpen, Home, PlusCircle, Share, User } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();
  
  return (
    <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="flex justify-around">
        <Link href="/">
          <a className="flex flex-col items-center py-2">
            <Home className={`text-xl ${location === '/' ? 'text-lib-secondary' : 'text-lib-primary'}`} />
            <span className="text-xs mt-1">Home</span>
          </a>
        </Link>
        <Link href="/">
          <a className="flex flex-col items-center py-2">
            <BookOpen className="text-xl text-lib-primary" />
            <span className="text-xs mt-1">Libraries</span>
          </a>
        </Link>
        <Link href="/convert">
          <a className="flex flex-col items-center py-2">
            <PlusCircle className={`text-2xl ${location === '/convert' ? 'text-lib-secondary-dark' : 'text-lib-secondary'}`} />
            <span className="text-xs mt-1">Create</span>
          </a>
        </Link>
        <Link href="/">
          <a className="flex flex-col items-center py-2">
            <Share className="text-xl text-lib-primary" />
            <span className="text-xs mt-1">Shared</span>
          </a>
        </Link>
        <Link href="/">
          <a className="flex flex-col items-center py-2">
            <User className="text-xl text-lib-primary" />
            <span className="text-xs mt-1">Profile</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
