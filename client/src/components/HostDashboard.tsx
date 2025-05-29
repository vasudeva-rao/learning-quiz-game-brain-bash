import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Plus, Trash2, Play, Settings, CheckCircle, XCircle } from "lucide-react";
import GameRoom from "@/components/GameRoom";
import MultiplayerGameRoom from "@/components/MultiplayerGameRoom";

interface Question {
  id: string;
  type: 'true-false' | 'multiple-choice' | 'multiple-select';
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
  const [gameSettings, setGameSettings] = useState({
    title: '',
    passcode: '',
    requirePasscode: false,
    negativePoints: false,
    timeLimit: 10
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswers: [],
    timeLimit: 10
  });

  const addQuestion = () => {
    if (!currentQuestion.question?.trim()) return;
    
    // Validate that correct answers are selected
    if (currentQuestion.correctAnswers?.length === 0) {
      alert('Please select at least one correct answer!');
      return;
    }
    
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: currentQuestion.type || 'multiple-choice',
      question: currentQuestion.question,
      options: currentQuestion.options?.filter(opt => opt.trim()) || [],
      correctAnswers: currentQuestion.correctAnswers || [],
      timeLimit: currentQuestion.timeLimit || 10
    };
    
    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswers: [],
      timeLimit: 10
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const startGame = () => {
    if (questions.length === 0 || !gameSettings.title.trim()) return;
    setGameStarted(true);
  };

  const handleCorrectAnswerChange = (value: string, checked: boolean) => {
    if (currentQuestion.type === 'multiple-select') {
      // Multiple select: can have multiple correct answers
      const currentAnswers = currentQuestion.correctAnswers || [];
      if (checked) {
        setCurrentQuestion({
          ...currentQuestion,
          correctAnswers: [...currentAnswers, value]
        });
      } else {
        setCurrentQuestion({
          ...currentQuestion,
          correctAnswers: currentAnswers.filter(ans => ans !== value)
        });
      }
    } else {
      // Single select (multiple-choice or true-false): only one correct answer
      setCurrentQuestion({
        ...currentQuestion,
        correctAnswers: [value]
      });
    }
  };

  if (gameStarted) {
    return (
      <MultiplayerGameRoom 
        gameSettings={gameSettings} 
        questions={questions} 
        isHost={true}
        playerName="Host"
        onEndGame={() => setGameStarted(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
          {/* Game Settings */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Game Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-white">Game Title</Label>
                <Input
                  id="title"
                  value={gameSettings.title}
                  onChange={(e) => setGameSettings({...gameSettings, title: e.target.value})}
                  placeholder="Enter quiz title..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requirePasscode"
                  checked={gameSettings.requirePasscode}
                  onCheckedChange={(checked) => 
                    setGameSettings({...gameSettings, requirePasscode: checked})
                  }
                />
                <Label htmlFor="requirePasscode" className="text-white">Require Passcode</Label>
              </div>

              {gameSettings.requirePasscode && (
                <div>
                  <Label htmlFor="passcode" className="text-white">Passcode</Label>
                  <Input
                    id="passcode"
                    value={gameSettings.passcode}
                    onChange={(e) => setGameSettings({...gameSettings, passcode: e.target.value})}
                    placeholder="Enter passcode..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="negativePoints"
                  checked={gameSettings.negativePoints}
                  onCheckedChange={(checked) => 
                    setGameSettings({...gameSettings, negativePoints: checked})
                  }
                />
                <Label htmlFor="negativePoints" className="text-white">Negative Points for Wrong Answers</Label>
              </div>

              <div>
                <Label htmlFor="timeLimit" className="text-white">Default Time Limit (seconds)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={gameSettings.timeLimit}
                  onChange={(e) => setGameSettings({...gameSettings, timeLimit: parseInt(e.target.value) || 10})}
                  className="bg-white/10 border-white/20 text-white"
                  min="5"
                  max="60"
                />
              </div>
            </CardContent>
          </Card>

          {/* Add Question */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Question
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Question Type</Label>
                <Select 
                  value={currentQuestion.type} 
                  onValueChange={(value: any) => setCurrentQuestion({
                    ...currentQuestion, 
                    type: value,
                    correctAnswers: [],
                    options: value === 'true-false' ? [] : ['', '', '', '']
                  })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true-false">True/False</SelectItem>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="multiple-select">Multiple Select</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Question</Label>
                <Textarea
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                  placeholder="Enter your question..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              {currentQuestion.type === 'true-false' ? (
                <div>
                  <Label className="text-white">Correct Answer</Label>
                  <RadioGroup 
                    value={currentQuestion.correctAnswers?.[0] || ''}
                    onValueChange={(value) => handleCorrectAnswerChange(value, true)}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg">
                      <RadioGroupItem value="True" id="true" className="border-white/40" />
                      <Label htmlFor="true" className="text-white flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        True
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg">
                      <RadioGroupItem value="False" id="false" className="border-white/40" />
                      <Label htmlFor="false" className="text-white flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        False
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              ) : (
                <>
                  <div>
                    <Label className="text-white">Answer Options</Label>
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex gap-2 mt-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(currentQuestion.options || [])];
                            newOptions[index] = e.target.value;
                            setCurrentQuestion({...currentQuestion, options: newOptions});
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label className="text-white">
                      {currentQuestion.type === 'multiple-select' ? 'Correct Answers (select all that apply)' : 'Correct Answer'}
                    </Label>
                    <div className="mt-2 space-y-2">
                      {currentQuestion.type === 'multiple-select' ? (
                        currentQuestion.options?.map((option, index) => {
                          if (!option.trim()) return null;
                          
                          const isCorrect = currentQuestion.correctAnswers?.includes(option) || false;
                          
                          return (
                            <div key={index} className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg">
                              <Checkbox
                                id={`correct-${index}`}
                                checked={isCorrect}
                                onCheckedChange={(checked) => handleCorrectAnswerChange(option, checked as boolean)}
                                className="border-white/40"
                              />
                              <Label htmlFor={`correct-${index}`} className="text-white">
                                {String.fromCharCode(65 + index)}. {option}
                              </Label>
                            </div>
                          );
                        })
                      ) : (
                        <RadioGroup 
                          value={currentQuestion.correctAnswers?.[0] || ''}
                          onValueChange={(value) => handleCorrectAnswerChange(value, true)}
                        >
                          {currentQuestion.options?.map((option, index) => {
                            if (!option.trim()) return null;
                            
                            return (
                              <div key={index} className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg">
                                <RadioGroupItem 
                                  value={option} 
                                  id={`correct-${index}`}
                                  className="border-white/40"
                                />
                                <Label htmlFor={`correct-${index}`} className="text-white">
                                  {String.fromCharCode(65 + index)}. {option}
                                </Label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="questionTimeLimit" className="text-white">Time Limit (seconds)</Label>
                <Input
                  id="questionTimeLimit"
                  type="number"
                  value={currentQuestion.timeLimit}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, timeLimit: parseInt(e.target.value) || 10})}
                  className="bg-white/10 border-white/20 text-white"
                  min="5"
                  max="60"
                />
              </div>

              <Button 
                onClick={addQuestion}
                className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
                disabled={!currentQuestion.question?.trim() || currentQuestion.correctAnswers?.length === 0}
              >
                Add Question
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Questions List */}
        {questions.length > 0 && (
          <Card className="mt-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Questions ({questions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="bg-white/5 rounded-lg p-4 flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm">
                          {index + 1}
                        </span>
                        <span className="text-white/70 text-sm capitalize">
                          {question.type.replace('-', ' ')}
                        </span>
                        <span className="text-white/50 text-xs">
                          {question.timeLimit}s
                        </span>
                      </div>
                      <p className="text-white font-medium mb-2">{question.question}</p>
                      {question.options && question.options.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className={`text-sm flex items-center gap-2 ${
                              question.correctAnswers.includes(option) 
                                ? 'text-green-400 font-medium' 
                                : 'text-white/70'
                            }`}>
                              {question.correctAnswers.includes(option) && (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              {String.fromCharCode(65 + optIndex)}. {option}
                            </div>
                          ))}
                        </div>
                      )}
                      {question.type === 'true-false' && (
                        <div className="mt-2">
                          <span className="text-green-400 font-medium text-sm flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Correct: {question.correctAnswers[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Game */}
        {questions.length > 0 && gameSettings.title.trim() && (
          <div className="mt-8 text-center">
            <Button 
              onClick={startGame}
              size="lg"
              className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold px-8 py-4 text-lg"
            >
              <Play className="w-6 h-6 mr-2" />
              Start Game
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostDashboard;
