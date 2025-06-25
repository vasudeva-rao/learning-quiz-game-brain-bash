import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ANSWER_COLORS, GameState } from "@/lib/game-types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import {
  CheckSquare,
  Circle,
  Crown,
  HelpCircle,
  History,
  Medal,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTheme } from "@/components/theme-provider";
import { ThemeSwitcher } from "@/components/theme-switcher";

interface HostDashboardProps {
  gameState: GameState;
  onNavigate: (state: Partial<GameState>) => void;
}

interface Question {
  questionText: string;
  questionType: "multiple_choice" | "multi_select" | "true_false";
  answers: string[];
  correctAnswerIndex?: number;
  correctAnswerIndices?: number[];
}

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
}

interface GameHistory {
  id: string;
  title: string;
  description: string | null;
  gameCode: string;
  status: string;
  playerCount: number;
  questionCount: number;
  createdAt: string;
  finalResults?: Player[];
}

export default function HostDashboard({
  gameState,
  onNavigate,
}: HostDashboardProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [gameTitle, setGameTitle] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  const [timePerQuestion, setTimePerQuestion] = useState("30");
  const [pointsPerQuestion, setPointsPerQuestion] = useState("1000");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch game history
  const { data: gameHistory = [] } = useQuery<GameHistory[]>({
    queryKey: ["/api/host/games"],
    queryFn: async () => {
      const hostedGames = JSON.parse(
        localStorage.getItem("hostedGames") || "[]"
      );
      if (hostedGames.length === 0) {
        return [];
      }
      const response = await apiRequest("POST", "/api/host/games", {
        gameIds: hostedGames,
      });
      return response.json();
    },
    enabled: true, // Always try to fetch, queryFn handles the empty case
  });

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        questionType: "multiple_choice",
        answers: ["", "", "", ""],
        correctAnswerIndex: 0,
        correctAnswerIndices: [],
      },
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    if (field === "answers") {
      updatedQuestions[index].answers = value;
    } else if (field === "questionType") {
      const question = updatedQuestions[index];
      if (value === "true_false") {
        updatedQuestions[index] = {
          ...question,
          questionType: value,
          answers: ["True", "False"],
          correctAnswerIndex: 0,
          correctAnswerIndices: [],
        };
      } else {
        updatedQuestions[index] = {
          ...question,
          questionType: value,
          answers: question.answers.length < 2 ? ["", ""] : question.answers,
        };
      }
    } else {
      (updatedQuestions[index] as any)[field] = value;
    }
    setQuestions(updatedQuestions);
  };

  const updateAnswer = (
    questionIndex: number,
    answerIndex: number,
    value: string
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].answers[answerIndex] = value;
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const createGame = async () => {
    if (!gameTitle.trim() || questions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a game title and at least one question.",
        variant: "destructive",
      });
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim() || q.answers.some((a) => !a.trim())) {
        toast({
          title: "Validation Error",
          description: `Question ${
            i + 1
          } is incomplete. Please fill in all fields.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsCreating(true);
    try {
      // Create game
      const gameResponse = await apiRequest("POST", "/api/games", {
        title: gameTitle,
        description: gameDescription,
        timePerQuestion: parseInt(timePerQuestion),
        pointsPerQuestion: parseInt(pointsPerQuestion),
      });

      const game = await gameResponse.json();

      // Store the gameId in localStorage for history
      const hostedGames = JSON.parse(
        localStorage.getItem("hostedGames") || "[]"
      );
      hostedGames.push(game.id);
      localStorage.setItem("hostedGames", JSON.stringify(hostedGames));

      // Add questions
      await apiRequest("POST", `/api/games/${game.id}/questions`, {
        questions,
      });

      // Fetch players to get the host player's id
      const playersResponse = await apiRequest(
        "GET",
        `/api/games/${game.id}/players`
      );
      const players = await playersResponse.json();
      const hostPlayer = players.find((p: any) => p.isHost);

      toast({
        title: "Game Created!",
        description: `Room code: ${game.gameCode}`,
      });

      onNavigate({
        type: "game-lobby",
        gameId: game.id,
        gameCode: game.gameCode,
        playerId: hostPlayer?.id,
        isHost: true,
      });

      // Invalidate the game history query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/host/games"] });
    } catch (error) {
      console.error("Error creating game:", error);
      toast({
        title: "Error",
        description: "Failed to create game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleTabChange = (value: string) => {
    if (value === "history") {
      queryClient.refetchQueries({ queryKey: ["/api/host/games"] });
    }
  };

  const rehostGame = async (gameId: string) => {
    try {
      const response = await apiRequest("POST", `/api/games/${gameId}/rehost`);
      const newGame = await response.json();

      // Also store the new game's ID in localStorage for history
      const hostedGames = JSON.parse(
        localStorage.getItem("hostedGames") || "[]"
      );
      hostedGames.push(newGame.id);
      localStorage.setItem("hostedGames", JSON.stringify(hostedGames));

      queryClient.invalidateQueries({ queryKey: ["/api/host/games"] });

      toast({
        title: "Game Ready!",
        description: `A new lobby has been created with room code: ${newGame.gameCode}`,
      });

      onNavigate({
        type: "game-lobby",
        gameId: newGame.id,
        gameCode: newGame.gameCode,
        playerId: newGame.hostId,
        isHost: true,
      });
    } catch (error) {
      console.error("Error re-hosting game:", error);
      toast({
        title: "Error",
        description: "Failed to re-host the game. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getBackgroundClass = () => {
    if (theme === "original") {
      return "bg-gradient-to-br from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)]";
    }
    return "bg-background";
  };

  return (
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 shadow-2xl bg-card">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-foreground">
                Host Dashboard
              </h2>
              <div className="flex items-center gap-4">
                <ThemeSwitcher />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onNavigate({ type: "home" })}
                >
                  <X className="text-2xl" />
                </Button>
              </div>
            </div>

            <Tabs defaultValue="create" className="w-full" onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">Create New Game</TabsTrigger>
                <TabsTrigger value="history">Game History</TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="mt-6">
                {/* Game Settings */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <Label className="text-sm font-semibold text-foreground mb-2">
                      Game Title
                    </Label>
                    <Input
                      placeholder="Enter quiz title..."
                      value={gameTitle}
                      onChange={(e) => setGameTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground mb-2">
                      Description
                    </Label>
                    <Input
                      placeholder="Brief description..."
                      value={gameDescription}
                      onChange={(e) => setGameDescription(e.target.value)}
                    />
                  </div>
                </div>

                {/* Game Configuration */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <Label className="text-sm font-semibold text-foreground mb-2">
                      Time per Question
                    </Label>
                    <Select
                      value={timePerQuestion}
                      onValueChange={setTimePerQuestion}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="45">45 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                        <SelectItem value="90">90 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground mb-2">
                      Points per Question
                    </Label>
                    <Select
                      value={pointsPerQuestion}
                      onValueChange={setPointsPerQuestion}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100 points</SelectItem>
                        <SelectItem value="200">200 points</SelectItem>
                        <SelectItem value="500">500 points</SelectItem>
                        <SelectItem value="1000">1000 points</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Questions Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-foreground">
                      Questions
                    </h3>
                    <Button
                      onClick={addQuestion}
                      className="bg-green-500 text-white hover:bg-green-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  {questions.map((question, questionIndex) => (
                    <Card key={questionIndex} className="bg-muted/50 p-6 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                          Question {questionIndex + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(questionIndex)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="mb-4">
                        <div className="flex gap-4 mb-3">
                          <div className="flex-1">
                            <Label className="text-sm font-semibold text-muted-foreground mb-2">
                              Question Type
                            </Label>
                            <Select
                              value={question.questionType}
                              onValueChange={(value) =>
                                updateQuestion(
                                  questionIndex,
                                  "questionType",
                                  value
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple_choice">
                                  <div className="flex items-center gap-2">
                                    <Circle className="w-4 h-4" />
                                    Multiple Choice
                                  </div>
                                </SelectItem>
                                <SelectItem value="multi_select">
                                  <div className="flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4" />
                                    Multi-Select
                                  </div>
                                </SelectItem>
                                <SelectItem value="true_false">
                                  <div className="flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4" />
                                    True/False
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Enter your question..."
                          value={question.questionText}
                          onChange={(e) =>
                            updateQuestion(
                              questionIndex,
                              "questionText",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {question.answers.map((answer, answerIndex) => (
                          <div
                            key={answerIndex}
                            className={`${ANSWER_COLORS[answerIndex]} text-white p-3 rounded-xl`}
                          >
                            <Input
                              placeholder={`Answer ${String.fromCharCode(
                                65 + answerIndex
                              )}`}
                              value={answer}
                              onChange={(e) =>
                                updateAnswer(
                                  questionIndex,
                                  answerIndex,
                                  e.target.value
                                )
                              }
                              className="bg-transparent border-none text-white placeholder-white/70"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground mb-2">
                          {question.questionType === "multi_select"
                            ? "Correct Answers (Multiple)"
                            : "Correct Answer"}
                        </Label>
                        {question.questionType === "multi_select" ? (
                          <div className="space-y-2">
                            {question.answers.map((answer, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`correct-${questionIndex}-${index}`}
                                  checked={(
                                    question.correctAnswerIndices || []
                                  ).includes(index)}
                                  onCheckedChange={(checked) => {
                                    const currentIndices =
                                      question.correctAnswerIndices || [];
                                    const newIndices = checked
                                      ? [...currentIndices, index]
                                      : currentIndices.filter(
                                          (i) => i !== index
                                        );
                                    updateQuestion(
                                      questionIndex,
                                      "correctAnswerIndices",
                                      newIndices
                                    );
                                  }}
                                />
                                <Label
                                  htmlFor={`correct-${questionIndex}-${index}`}
                                  className="text-sm text-foreground"
                                >
                                  {String.fromCharCode(65 + index)} -{" "}
                                  {answer ||
                                    `Answer ${String.fromCharCode(65 + index)}`}
                                </Label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Select
                            value={(
                              question.correctAnswerIndex ?? 0
                            ).toString()}
                            onValueChange={(value) =>
                              updateQuestion(
                                questionIndex,
                                "correctAnswerIndex",
                                parseInt(value)
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {question.answers.map((answer, index) => (
                                <SelectItem
                                  key={index}
                                  value={index.toString()}
                                >
                                  {String.fromCharCode(65 + index)} -{" "}
                                  {answer ||
                                    `Answer ${String.fromCharCode(65 + index)}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </Card>
                  ))}

                  {questions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>
                        No questions added yet. Click "Add Question" to get
                        started!
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <Button
                    onClick={createGame}
                    disabled={isCreating}
                    className="bg-gradient-to-r from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)] text-white px-8 py-3 text-lg flex-1 hover:shadow-lg transition-shadow"
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Create Game
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        My Games
                      </h3>
                      <p className="text-muted-foreground">
                        Review your past games or start a new one.
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {gameHistory.length} total games
                    </div>
                  </div>
                  {gameHistory.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {gameHistory.map((game, index) => (
                        <AccordionItem value={`item-${index}`} key={game.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex justify-between items-center w-full pr-4">
                              <div className="text-left">
                                <p className="text-lg font-semibold text-foreground">
                                  {game.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Played on{" "}
                                  {new Date(game.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {game.playerCount}
                                </span>
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    game.status === "completed"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {game.status}
                                </span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-2 pr-4 py-2 bg-muted/50 rounded-b-lg">
                              <div className="flex justify-between items-center mb-4">
                                <div>
                                  <p className="text-md font-semibold text-foreground">
                                    Final Standings
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Room Code: {game.gameCode}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rehostGame(game.id)}
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Re-host
                                </Button>
                              </div>
                              <div className="space-y-3">
                                {game.finalResults &&
                                game.finalResults.filter((p) => !p.isHost).length >
                                  0 ? (
                                  game.finalResults
                                    .filter((p) => !p.isHost)
                                    .map((player, playerIndex) => (
                                      <div
                                        key={player.id}
                                        className="flex items-center justify-between p-3 bg-background rounded-lg shadow-sm"
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="font-bold text-muted-foreground w-5 text-center">
                                            {playerIndex === 0 ? (
                                              <Crown className="w-5 h-5 text-yellow-500" />
                                            ) : playerIndex === 1 ? (
                                              <Trophy className="w-5 h-5 text-slate-400" />
                                            ) : playerIndex === 2 ? (
                                              <Medal className="w-5 h-5 text-yellow-700" />
                                            ) : (
                                              playerIndex + 1
                                            )}
                                          </span>
                                          <span className="text-2xl">
                                            {player.avatar}
                                          </span>
                                          <span className="font-medium text-foreground">
                                            {player.name}
                                          </span>
                                        </div>
                                        <span className="font-bold text-foreground">
                                          {player.score.toLocaleString()} pts
                                        </span>
                                      </div>
                                    ))
                                ) : (
                                  <p className="text-center text-muted-foreground py-4">
                                    No player data available for this game.
                                  </p>
                                )}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        No games yet
                      </h4>
                      <p className="text-muted-foreground mb-4">
                        Create your first quiz game to get started
                      </p>
                      <Button
                        onClick={() => {
                          const createTab = document.querySelector(
                            '[value="create"]'
                          ) as HTMLElement;
                          createTab?.click();
                        }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Game
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </section>
    </div>
  );
}