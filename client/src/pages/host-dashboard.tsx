import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Edit, Trash2, Play, Save, RefreshCw, History, Users, HelpCircle, Calendar, Palette, CheckSquare, Circle } from "lucide-react";
import { GameState, QuestionData, ANSWER_COLORS, ANSWER_TEXT_COLORS } from "@/lib/game-types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";
import { Checkbox } from "@/components/ui/checkbox";

interface HostDashboardProps {
  gameState: GameState;
  onNavigate: (state: Partial<GameState>) => void;
}

interface Question {
  questionText: string;
  questionType: 'multiple_choice' | 'multi_select' | 'true_false';
  answers: string[];
  correctAnswerIndex?: number;
  correctAnswerIndices?: number[];
}

interface GameHistory {
  id: number;
  title: string;
  description: string | null;
  roomCode: string;
  status: string;
  playerCount: number;
  questionCount: number;
  createdAt: string;
}

export default function HostDashboard({ gameState, onNavigate }: HostDashboardProps) {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [gameTitle, setGameTitle] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  const [timePerQuestion, setTimePerQuestion] = useState("30");
  const [pointsPerQuestion, setPointsPerQuestion] = useState("1000");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch game history
  const { data: gameHistory = [] } = useQuery<GameHistory[]>({
    queryKey: ['/api/host/games'],
  });

  const addQuestion = () => {
    setQuestions([...questions, {
      questionText: "",
      questionType: "multiple_choice",
      answers: ["", "", "", ""],
      correctAnswerIndex: 0,
      correctAnswerIndices: []
    }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    if (field === 'answers') {
      updatedQuestions[index].answers = value;
    } else if (field === 'questionType') {
      const question = updatedQuestions[index];
      if (value === 'true_false') {
        updatedQuestions[index] = { 
          ...question, 
          questionType: value,
          answers: ['True', 'False'],
          correctAnswerIndex: 0,
          correctAnswerIndices: []
        };
      } else {
        updatedQuestions[index] = { 
          ...question, 
          questionType: value,
          answers: question.answers.length < 2 ? ['', ''] : question.answers
        };
      }
    } else {
      (updatedQuestions[index] as any)[field] = value;
    }
    setQuestions(updatedQuestions);
  };

  const updateAnswer = (questionIndex: number, answerIndex: number, value: string) => {
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
      if (!q.questionText.trim() || q.answers.some(a => !a.trim())) {
        toast({
          title: "Validation Error",
          description: `Question ${i + 1} is incomplete. Please fill in all fields.`,
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

      // Add questions
      await apiRequest("POST", `/api/games/${game.id}/questions`, questions);

      toast({
        title: "Game Created!",
        description: `Room code: ${game.roomCode}`,
      });

      onNavigate({ 
        type: 'game-lobby', 
        gameId: game.id, 
        roomCode: game.roomCode,
        isHost: true 
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)]">
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Host Dashboard</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-600" />
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Original</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onNavigate({ type: 'home' })}
                >
                  <X className="text-2xl" />
                </Button>
              </div>
            </div>

            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">Create New Game</TabsTrigger>
                <TabsTrigger value="history">Game History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="create" className="mt-6">
                {/* Game Settings */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2">Game Title</Label>
                <Input 
                  placeholder="Enter quiz title..."
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  className="border-2 focus:border-quiz-purple"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2">Description</Label>
                <Input 
                  placeholder="Brief description..."
                  value={gameDescription}
                  onChange={(e) => setGameDescription(e.target.value)}
                  className="border-2 focus:border-quiz-purple"
                />
              </div>
            </div>

            {/* Game Configuration */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2">Time per Question</Label>
                <Select value={timePerQuestion} onValueChange={setTimePerQuestion}>
                  <SelectTrigger className="border-2 focus:border-quiz-purple">
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
                <Label className="text-sm font-semibold text-gray-700 mb-2">Points per Question</Label>
                <Select value={pointsPerQuestion} onValueChange={setPointsPerQuestion}>
                  <SelectTrigger className="border-2 focus:border-quiz-purple">
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
                <h3 className="text-xl font-bold text-gray-800">Questions</h3>
                <Button 
                  onClick={addQuestion}
                  className="bg-quiz-green text-white hover:bg-green-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {questions.map((question, questionIndex) => (
                <Card key={questionIndex} className="bg-gray-50 p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-quiz-purple text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Question {questionIndex + 1}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeQuestion(questionIndex)}
                      className="text-quiz-red hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex gap-4 mb-3">
                      <div className="flex-1">
                        <Label className="text-sm font-semibold text-gray-600 mb-2">Question Type</Label>
                        <Select 
                          value={question.questionType} 
                          onValueChange={(value) => updateQuestion(questionIndex, 'questionType', value)}
                        >
                          <SelectTrigger className="w-full">
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
                      onChange={(e) => updateQuestion(questionIndex, 'questionText', e.target.value)}
                      className="border-2 focus:border-quiz-purple"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {question.answers.map((answer, answerIndex) => (
                      <div key={answerIndex} className={`${ANSWER_COLORS[answerIndex]} text-white p-3 rounded-xl`}>
                        <Input
                          placeholder={`Answer ${String.fromCharCode(65 + answerIndex)}`}
                          value={answer}
                          onChange={(e) => updateAnswer(questionIndex, answerIndex, e.target.value)}
                          className="bg-transparent border-none text-white placeholder-white/70"
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-600 mb-2">
                      {question.questionType === 'multi_select' ? 'Correct Answers (Multiple)' : 'Correct Answer'}
                    </Label>
                    {question.questionType === 'multi_select' ? (
                      <div className="space-y-2">
                        {question.answers.map((answer, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Checkbox
                              id={`correct-${questionIndex}-${index}`}
                              checked={(question.correctAnswerIndices || []).includes(index)}
                              onCheckedChange={(checked) => {
                                const currentIndices = question.correctAnswerIndices || [];
                                const newIndices = checked 
                                  ? [...currentIndices, index]
                                  : currentIndices.filter(i => i !== index);
                                updateQuestion(questionIndex, 'correctAnswerIndices', newIndices);
                              }}
                            />
                            <Label htmlFor={`correct-${questionIndex}-${index}`} className="text-sm">
                              {String.fromCharCode(65 + index)} - {answer || `Answer ${String.fromCharCode(65 + index)}`}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Select 
                        value={(question.correctAnswerIndex ?? 0).toString()} 
                        onValueChange={(value) => updateQuestion(questionIndex, 'correctAnswerIndex', parseInt(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {question.answers.map((answer, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {String.fromCharCode(65 + index)} - {answer || `Answer ${String.fromCharCode(65 + index)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </Card>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No questions added yet. Click "Add Question" to get started!</p>
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
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">Your Game History</h3>
                    <div className="text-sm text-gray-500">
                      {gameHistory?.length || 0} total games
                    </div>
                  </div>

                  {gameHistory && gameHistory.length > 0 ? (
                    <div className="grid gap-4">
                      {gameHistory.map((game: GameHistory) => (
                        <Card key={game.id} className="p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-800">{game.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  game.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  game.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {game.status}
                                </span>
                              </div>
                              {game.description && (
                                <p className="text-gray-600 mb-3">{game.description}</p>
                              )}
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Users className="w-4 h-4" />
                                  <span>{game.playerCount} players</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <HelpCircle className="w-4 h-4" />
                                  <span>{game.questionCount} questions</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(game.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="bg-quiz-purple text-white px-3 py-1 rounded-full text-sm font-semibold mb-2">
                                {game.roomCode}
                              </div>
                              {game.status === 'lobby' && (
                                <Button
                                  size="sm"
                                  onClick={() => onNavigate({
                                    type: 'game-lobby',
                                    gameId: game.id,
                                    roomCode: game.roomCode,
                                    isHost: true
                                  })}
                                  className="bg-quiz-green text-white hover:bg-green-600"
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Resume
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-600 mb-2">No games yet</h4>
                      <p className="text-gray-500 mb-4">Create your first quiz game to get started</p>
                      <Button
                        onClick={() => {
                          const createTab = document.querySelector('[value="create"]') as HTMLElement;
                          createTab?.click();
                        }}
                        className="bg-quiz-purple text-white hover:bg-purple-600"
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
