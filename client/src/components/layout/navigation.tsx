import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="font-['Outfit'] font-bold text-2xl text-primary cursor-pointer">
                  📚 Lib<span className="text-secondary">Dict</span>
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8 sm:items-center">
              {user ? (
                <>
                  <Link href="/my-library">
                    <span
                      className={`${
                        isActive("/my-library")
                          ? "border-primary text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      } inline-flex items-center px-1 py-4 border-b-2 text-sm font-medium cursor-pointer`}
                    >
                      My Library
                    </span>
                  </Link>
                  <Link href="/create">
                    <span
                      className={`${
                        isActive("/create")
                          ? "border-primary text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      } inline-flex items-center px-1 py-4 border-b-2 text-sm font-medium cursor-pointer`}
                    >
                      Create
                    </span>
                  </Link>
                  <Link href="/community">
                    <span
                      className={`${
                        isActive("/community")
                          ? "border-primary text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      } inline-flex items-center px-1 py-4 border-b-2 text-sm font-medium cursor-pointer`}
                    >
                      Community
                    </span>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/">
                    <span
                      className={`${
                        isActive("/")
                          ? "border-primary text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      } inline-flex items-center px-1 py-4 border-b-2 text-sm font-medium cursor-pointer`}
                    >
                      Home
                    </span>
                  </Link>
                  <Link href="/community">
                    <span
                      className={`${
                        isActive("/community")
                          ? "border-primary text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      } inline-flex items-center px-1 py-4 border-b-2 text-sm font-medium cursor-pointer`}
                    >
                      Community
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex text-sm p-0.5 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <Avatar className="h-8 w-8 rounded-full border-2 border-primary/20 overflow-hidden">
                      <AvatarImage src={user.photoURL || undefined} alt="Profile" className="object-cover" />
                      <AvatarFallback className="bg-primary text-white">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <span className="text-sm font-medium">
                      {user.displayName || user.email}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/my-library">My Library</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/create">Create Deck</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/community">Community</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/sign-in">
                <Button variant="default">Sign In</Button>
              </Link>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-6">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-8 w-8 rounded-full border-2 border-primary/20 overflow-hidden">
                          <AvatarImage src={user.photoURL || undefined} alt="Profile" className="object-cover" />
                          <AvatarFallback className="bg-primary text-white">
                            {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {user.displayName || user.email}
                        </span>
                      </div>
                      <Link href="/my-library">
                        <span
                          className="text-base font-medium text-gray-900 hover:text-primary cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          My Library
                        </span>
                      </Link>
                      <Link href="/create">
                        <span
                          className="text-base font-medium text-gray-900 hover:text-primary cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Create
                        </span>
                      </Link>
                      <Link href="/community">
                        <span
                          className="text-base font-medium text-gray-900 hover:text-primary cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Community
                        </span>
                      </Link>
                      <Link href="/settings">
                        <span
                          className="text-base font-medium text-gray-900 hover:text-primary cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Settings
                        </span>
                      </Link>
                      <a
                        className="text-base font-medium text-gray-900 hover:text-primary cursor-pointer"
                        onClick={() => {
                          logout();
                          setIsMenuOpen(false);
                        }}
                      >
                        Sign Out
                      </a>
                    </>
                  ) : (
                    <>
                      <Link href="/">
                        <span
                          className="text-base font-medium text-gray-900 hover:text-primary cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Home
                        </span>
                      </Link>
                      <Link href="/community">
                        <span
                          className="text-base font-medium text-gray-900 hover:text-primary cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Community
                        </span>
                      </Link>
                      <Link href="/sign-in">
                        <span
                          className="text-base font-medium text-primary hover:text-primary/90 cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Sign In
                        </span>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}