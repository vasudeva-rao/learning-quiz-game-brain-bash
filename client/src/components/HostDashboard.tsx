import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, Play } from "lucide-react";
import GameRoom from "@/components/GameRoom";

interface Question {
  id: string;
  type: "true-false" | "multiple-choice" | "multiple-select";
  question: string;
  options?: string[];
  correctAnswers: string[];
  timeLimit: number;
}

interface HostDashboardProps {
  onBack: () => void;
}

const HostDashboard = ({ onBack }: HostDashboardProps) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePin, setGamePin] = useState<string | null>(null);
  const [gameSettings, setGameSettings] = useState({
    title: "",
    passcode: "",
    requirePasscode: false,
    negativePoints: false,
    timeLimit: 10,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: "multiple-choice",
    question: "",
    options: ["", "", "", ""],
    correctAnswers: [],
    timeLimit: 10,
  });

  const addQuestion = () => {
    if (!currentQuestion.question?.trim()) return;

    const newQuestion: Question = {
      id: Date.now().toString(),
      type: currentQuestion.type || "multiple-choice",
      question: currentQuestion.question,
      options: currentQuestion.options?.filter((opt) => opt.trim()) || [],
      correctAnswers: currentQuestion.correctAnswers || [],
      timeLimit: currentQuestion.timeLimit || 10,
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      type: "multiple-choice",
      question: "",
      options: ["", "", "", ""],
      correctAnswers: [],
      timeLimit: 10,
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const generateGamePin = () => {
    const min = 100000;
    const max = 999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const startGame = () => {
    if (questions.length === 0 || !gameSettings.title.trim()) return;
    const pin = generateGamePin().toString();
    setGamePin(pin);
    setGameStarted(true);
  };

  if (gameStarted) {
    return (
      <GameRoom
        gameSettings={gameSettings}
        questions={questions}
        isHost={true}
        playerName="Host"
        gamePin={gamePin}
        onEndGame={() => {
          setGameStarted(false);
          setGamePin(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-white">Create Your Quiz</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Game Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-white">
                  Game Title
                </Label>
                <Input
                  id="title"
                  value={gameSettings.title}
                  onChange={(e) =>
                    setGameSettings({ ...gameSettings, title: e.target.value })
                  }
                  placeholder="Enter quiz title..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              {/* <div className="flex items-center space-x-2">
                <Switch
                  id="requirePasscode"
                  checked={gameSettings.requirePasscode}
                  onCheckedChange={(checked) =>
                    setGameSettings({
                      ...gameSettings,
                      requirePasscode: checked,
                    })
                  }
                />
                <Label htmlFor="requirePasscode" className="text-white">
                  Require Passcode
                </Label>
              </div> */}

              {/* {gameSettings.requirePasscode && (
                <div>
                  <Label htmlFor="passcode" className="text-white">
                    Passcode
                  </Label>
                  <Input
                    id="passcode"
                    value={gameSettings.passcode}
                    onChange={(e) =>
                      setGameSettings({
                        ...gameSettings,
                        passcode: e.target.value,
                      })
                    }
                    placeholder="Enter passcode..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              )} */}

              <div className="flex items-center space-x-2">
                <Switch
                  id="negativePoints"
                  checked={gameSettings.negativePoints}
                  onCheckedChange={(checked) =>
                    setGameSettings({
                      ...gameSettings,
                      negativePoints: checked,
                    })
                  }
                />
                <Label htmlFor="negativePoints" className="text-white">
                  Negative Points for Wrong Answers
                </Label>
              </div>

              <div>
                <Label htmlFor="timeLimit" className="text-white">
                  Default Time Limit (seconds)
                </Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={gameSettings.timeLimit}
                  onChange={(e) =>
                    setGameSettings({
                      ...gameSettings,
                      timeLimit: parseInt(e.target.value) || 10,
                    })
                  }
                  className="bg-white/10 border-white/20 text-white"
                  min="5"
                  max="60"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Questions
                </div>
                <Button
                  onClick={startGame}
                  disabled={
                    questions.length === 0 || !gameSettings.title.trim()
                  }
                  className="bg-white text-purple-600 hover:bg-white/90"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Game
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="questionType" className="text-white">
                  Question Type
                </Label>
                <Select
                  value={currentQuestion.type}
                  onValueChange={(
                    value: "true-false" | "multiple-choice" | "multiple-select"
                  ) => setCurrentQuestion({ ...currentQuestion, type: value })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">
                      Multiple Choice
                    </SelectItem>
                    <SelectItem value="multiple-select">
                      Multiple Select
                    </SelectItem>
                    <SelectItem value="true-false">True/False</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="question" className="text-white">
                  Question
                </Label>
                <Textarea
                  id="question"
                  value={currentQuestion.question}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      question: e.target.value,
                    })
                  }
                  placeholder="Enter your question..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                />
              </div>

              {currentQuestion.type !== "true-false" && (
                <div className="space-y-4">
                  <Label className="text-white">Options</Label>
                  {currentQuestion.options?.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [
                            ...(currentQuestion.options || []),
                          ];
                          newOptions[index] = e.target.value;
                          setCurrentQuestion({
                            ...currentQuestion,
                            options: newOptions,
                          });
                        }}
                        placeholder={`Option ${index + 1}`}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const newOptions = currentQuestion.options?.filter(
                            (_, i) => i !== index
                          );
                          setCurrentQuestion({
                            ...currentQuestion,
                            options: newOptions,
                          });
                        }}
                        className="text-white hover:bg-white/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {currentQuestion.options &&
                    currentQuestion.options.length < 6 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentQuestion({
                            ...currentQuestion,
                            options: [...(currentQuestion.options || []), ""],
                          });
                        }}
                        className="mt-2 w-full bg-white/10 text-white hover:bg-white/20 border-dashed border-white/30"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add new option...
                      </Button>
                    )}
                </div>
              )}

              {currentQuestion.type !== "true-false" &&
                currentQuestion.options &&
                currentQuestion.options.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-white">Correct Answers</Label>
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg"
                      >
                        {currentQuestion.type === "multiple-choice" ? (
                          <input
                            type="radio"
                            name="correctAnswer"
                            id={`correct-option-${index}`}
                            value={option}
                            checked={currentQuestion.correctAnswers?.includes(
                              option
                            )}
                            onChange={() =>
                              setCurrentQuestion({
                                ...currentQuestion,
                                correctAnswers: [option],
                              })
                            }
                            className="form-radio h-4 w-4 text-purple-600 bg-white/10 border-white/40 focus:ring-purple-500"
                          />
                        ) : (
                          <input
                            type="checkbox"
                            id={`correct-option-${index}`}
                            checked={currentQuestion.correctAnswers?.includes(
                              option
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCurrentQuestion({
                                  ...currentQuestion,
                                  correctAnswers: [
                                    ...(currentQuestion.correctAnswers || []),
                                    option,
                                  ],
                                });
                              } else {
                                setCurrentQuestion({
                                  ...currentQuestion,
                                  correctAnswers:
                                    currentQuestion.correctAnswers?.filter(
                                      (ans) => ans !== option
                                    ),
                                });
                              }
                            }}
                            className="form-checkbox h-4 w-4 text-purple-600 bg-white/10 border-white/40 rounded focus:ring-purple-500"
                          />
                        )}
                        <Label
                          htmlFor={`correct-option-${index}`}
                          className="text-white"
                        >
                          {String.fromCharCode(65 + index)}. {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

              <div>
                <Label htmlFor="timeLimitQuestion" className="text-white">
                  Time Limit for this Question (seconds)
                </Label>
                <Input
                  id="timeLimitQuestion"
                  type="number"
                  value={currentQuestion.timeLimit}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      timeLimit: parseInt(e.target.value) || 10,
                    })
                  }
                  className="bg-white/10 border-white/20 text-white"
                  min="5"
                  max="60"
                />
              </div>

              <Button
                onClick={addQuestion}
                className="w-full bg-purple-500 text-white hover:bg-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Quiz Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <p className="text-white/70">
                No questions added yet. Start by adding your first question!
              </p>
            ) : (
              <div className="space-y-4">
                {questions.map((q, index) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  >
                    <span className="text-white">
                      {index + 1}. {q.question} ({q.type})
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() => removeQuestion(q.id)}
                      className="text-white hover:bg-white/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HostDashboard;
