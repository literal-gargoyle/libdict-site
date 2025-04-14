import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, BarChart2, Clock, LineChart, TrendingUp, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsData {
  overview: {
    totalCards: number;
    totalStudied: number;
    correctAnswers: number;
    incorrectAnswers: number;
    averageResponseTime: number;
    masteryRate: number;
  };
  trends: Array<{
    date: string;
    correctRate: number;
    responseTime: number;
  }>;
  masteryBySection: Array<{
    sectionId: number;
    sectionName: string;
    masteryRate: number;
    cardCount: number;
  }>;
  difficultCards: Array<{
    flashcardId: number;
    term: string;
    definition: string;
    correctRate: number;
    averageResponseTime: number;
    attemptCount: number;
  }>;
}

export default function Analytics() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/deck", id],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && !!id
  });

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load analytics data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data || data.overview.totalStudied === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Study Data Available</CardTitle>
            <CardDescription>
              You haven't studied this deck yet. Start studying to see analytics.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Study Performance Analytics</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Study Trends</TabsTrigger>
          <TabsTrigger value="sections">Section Mastery</TabsTrigger>
          <TabsTrigger value="difficult">Difficult Cards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5" />
                  Study Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Total Progress</span>
                      <span>{data.overview.totalStudied} / {data.overview.totalCards}</span>
                    </div>
                    <Progress value={(data.overview.totalStudied / data.overview.totalCards) * 100} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Mastery Rate</span>
                      <span>{data.overview.masteryRate}%</span>
                    </div>
                    <Progress value={data.overview.masteryRate} className="bg-gray-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    {data.overview.averageResponseTime} ms
                  </div>
                  <p className="text-muted-foreground">Average response time</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Answer Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {data.overview.correctAnswers}
                    </div>
                    <p className="text-sm text-muted-foreground">Correct</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">
                      {data.overview.incorrectAnswers}
                    </div>
                    <p className="text-sm text-muted-foreground">Incorrect</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>Your learning progress trends</CardDescription>
            </CardHeader>
            <CardContent>
              {data.trends.length < 2 ? (
                <div className="h-[350px] flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Not enough data to display trends. Study more to see your progress over time.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart
                    data={data.trends}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCorrect" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 'dataMax']} />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="correctRate"
                      name="Accuracy (%)"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorCorrect)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="responseTime"
                      name="Response Time (ms)"
                      stroke="#6366f1"
                      fillOpacity={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>Section Mastery</CardTitle>
              <CardDescription>Performance breakdown by section</CardDescription>
            </CardHeader>
            <CardContent>
              {data.masteryBySection.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center">
                  <p className="text-muted-foreground">
                    This deck doesn't have any sections or you haven't studied them yet.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={data.masteryBySection}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sectionName" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="masteryRate" 
                      fill="#8884d8" 
                      name="Mastery Rate (%)" 
                    />
                    <Bar 
                      dataKey="cardCount" 
                      fill="#82ca9d" 
                      name="Card Count" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="difficult">
          <Card>
            <CardHeader>
              <CardTitle>Most Challenging Cards</CardTitle>
              <CardDescription>Cards you might want to focus on</CardDescription>
            </CardHeader>
            <CardContent>
              {data.difficultCards.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">
                    No challenging cards found. Keep studying to identify areas for improvement.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.difficultCards.map((card) => (
                    <Card key={card.flashcardId} className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{card.term}</h3>
                            <p className="text-sm text-muted-foreground">{card.definition}</p>
                          </div>
                          <div className="flex flex-col md:flex-row gap-4 min-w-[200px]">
                            <div className="text-center">
                              <div className="text-xl font-bold text-red-500">{card.correctRate}%</div>
                              <p className="text-xs text-muted-foreground">Accuracy</p>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold">{card.averageResponseTime} ms</div>
                              <p className="text-xs text-muted-foreground">Avg. Response</p>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold">{card.attemptCount}</div>
                              <p className="text-xs text-muted-foreground">Attempts</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <div className="h-8 w-64 mx-auto mb-8">
        <Skeleton className="h-full w-full" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}