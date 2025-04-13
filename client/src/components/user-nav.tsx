import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";

interface UserNavProps {
  user: FirebaseUser | null;
}

export default function UserNav({ user }: UserNavProps) {
  const { signOutMutation } = useAuth();
  
  const handleLogout = () => {
    signOutMutation.mutate();
  };
  
  // Get display name or email
  const getDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || "User";
  };
  
  // Get user initials from display name or email
  const getUserInitials = () => {
    if (!user) return "?";
    
    if (user.displayName) {
      const nameParts = user.displayName.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return user.displayName.substring(0, 2).toUpperCase();
    }
    
    return user.email ? user.email.substring(0, 2).toUpperCase() : "?";
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full text-white flex items-center space-x-2 focus:ring-0">
          <Avatar className="h-10 w-10 border-2 border-lib-secondary">
            <AvatarImage src={user?.photoURL || ""} alt={getDisplayName()} />
            <AvatarFallback className="bg-gradient-to-br from-lib-primary to-purple-500 text-white">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline">{getDisplayName()}</span>
          <ChevronDown className="h-4 w-4 hidden md:inline" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.displayName || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
