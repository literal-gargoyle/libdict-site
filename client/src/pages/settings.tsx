import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CircleUser, Award, BookOpenCheck, ShareIcon, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/user/profile'], 
    enabled: !!user,
    initialData: user
  });

  // Calculate experience progress percentage
  const calculateProgress = () => {
    if (!profile) return 0;
    const expRequired = profile.level * 100;
    return Math.min(100, Math.round((profile.experience / expRequired) * 100));
  };

  // Calculate experience needed for next level
  const expForNextLevel = () => {
    if (!profile) return 100;
    return profile.level * 100;
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow bg-gray-50 py-12">
          <div className="container max-w-4xl mx-auto p-6">Loading user profile...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>User Settings | LibDict</title>
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow bg-gray-50 py-12">
          <div className="container max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">User Settings</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Profile Card */}
              <Card className="col-span-1">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl">Profile</CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    {profile.photoURL ? (
                      <AvatarImage src={profile.photoURL} alt={profile.displayName || 'User'} />
                    ) : (
                      <AvatarFallback className="text-3xl">
                        <CircleUser className="h-16 w-16" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h3 className="text-xl font-bold">{profile.displayName}</h3>
                  <p className="text-muted-foreground text-sm">{profile.email}</p>
                </CardContent>
              </Card>

              {/* Progress Card */}
              <Card className="col-span-1 md:col-span-2">
                <CardHeader className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">Experience Level</CardTitle>
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                      BETA
                    </Badge>
                  </div>
                  <CardDescription>Your progress in LibDict</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <Award className="h-6 w-6 text-primary" />
                      <span className="text-xl font-bold">Level {profile.level}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {profile.experience} / {expForNextLevel()} XP
                    </span>
                  </div>
                  <Progress value={calculateProgress()} className="h-3" />
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                      <BookOpenCheck className="h-6 w-6 text-primary mb-2" />
                      <span className="text-lg font-bold">{profile.decksShared}</span>
                      <span className="text-xs text-muted-foreground">Decks Shared</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                      <ShareIcon className="h-6 w-6 text-primary mb-2" />
                      <span className="text-lg font-bold">{Math.floor(profile.experience / 50)}</span>
                      <span className="text-xs text-muted-foreground">Total Contributions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-6" />

            <h2 className="text-2xl font-bold mb-4">Rewards & Achievements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Level Badges */}
              {[1, 2, 3, 5, 10].map(level => (
                <Card 
                  key={level} 
                  className={`${profile.level >= level ? 'bg-muted/50' : 'opacity-50 bg-muted/20'}`}
                >
                  <CardContent className="flex items-center p-4 space-x-4">
                    <div className={`rounded-full p-2 ${profile.level >= level ? 'bg-primary/20' : 'bg-muted'}`}>
                      <Star 
                        className={`h-6 w-6 ${profile.level >= level ? 'text-primary' : 'text-muted-foreground'}`} 
                      />
                    </div>
                    <div>
                      <p className="font-medium">Level {level} {level > 1 ? 'Master' : 'Novice'}</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.level >= level ? 'Unlocked' : 'Locked'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}