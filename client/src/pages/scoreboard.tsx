import * as React from 'react';
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";
import { GameState, PlayerData, WebSocketMessage } from "@/lib/game-types";
import { ArrowRight, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

interface ScoreboardProps {
  gameState: GameState;
  onNavigate: (state: Partial<GameState>) => void;
}

export default function Scoreboard({ gameState, onNavigate }: ScoreboardProps) {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const {
    connect,
    sendMessage,
    isConnected,
    addMessageHandler,
    removeMessageHandler,
  } = useWebSocket();

  useEffect(() => {
    const handler = (message: WebSocketMessage) => {
      switch (message.type) {
        case "question_ended":
          setPlayers(message.payload.players);
          break;
        case "question_started":
          onNavigate({ type: "gameplay" });
          break;
        case "game_completed":
          onNavigate({ type: "final-results" });
          break;
      }
    };
    addMessageHandler(handler);
    return () => removeMessageHandler(handler);
  }, [addMessageHandler, removeMessageHandler, onNavigate]);

  useEffect(() => {
    connect();
  }, [connect]);

  const nextQuestion = () => {
    if (!gameState.isHost) return;

    sendMessage({
      type: "next_question",
      payload: {
        gameCode: gameState.gameCode,
      },
    });
  };

  const getPodiumColors = (place: number) => {
    switch (place) {
      case 1:
        return "bg-gradient-to-br from-[hsl(43,96%,56%)] to-yellow-600";
      case 2:
        return "bg-gradient-to-br from-gray-300 to-gray-500";
      case 3:
        return "bg-gradient-to-br from-yellow-600 to-yellow-800";
      default:
        return "bg-quiz-purple";
    }
  };

  const getPodiumHeight = (place: number) => {
    switch (place) {
      case 1:
        return "w-24 h-32";
      case 2:
        return "w-20 h-24";
      case 3:
        return "w-20 h-20";
      default:
        return "w-8 h-8";
    }
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const topThree = sortedPlayers.slice(0, 3);
  const remaining = sortedPlayers.slice(3);

  // Arrange top 3 in podium order (2nd, 1st, 3rd)
  const podiumOrder = [
    topThree[1], // 2nd place
    topThree[0], // 1st place
    topThree[2], // 3rd place
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(271,81%,66%)] to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
            <Trophy className="inline text-quiz-yellow mr-4" />
            Scoreboard
          </h2>
          <p className="text-white text-xl opacity-90">
            After Question {currentQuestionIndex + 1} of {totalQuestions || 10}
          </p>
        </div>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="flex justify-center items-end mb-8 space-x-4">
            {podiumOrder.map((player, podiumIndex) => {
              if (!player) return null;

              const actualPlace =
                sortedPlayers.findIndex((p) => p.id === player.id) + 1;
              const placeText =
                actualPlace === 1 ? "1st" : actualPlace === 2 ? "2nd" : "3rd";

              return (
                <div key={player.id} className="text-center">
                  <div
                    className={`${getPodiumColors(
                      actualPlace
                    )} text-white ${getPodiumHeight(
                      actualPlace
                    )} rounded-t-3xl flex flex-col items-center justify-center mb-2`}
                  >
                    <div className="text-2xl mb-1">{player.avatar}</div>
                    <div className="text-xs font-bold">{placeText}</div>
                  </div>
                  <div
                    className={`bg-white rounded-2xl p-4 shadow-xl ${
                      actualPlace === 1 ? "border-4 border-quiz-yellow" : ""
                    }`}
                  >
                    <div className="font-bold text-gray-800">{player.name}</div>
                    <div
                      className={`text-2xl font-bold ${
                        actualPlace === 1
                          ? "text-quiz-yellow"
                          : "text-quiz-blue"
                      }`}
                    >
                      {player.score.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rest of Players */}
        {remaining.length > 0 && (
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-6 mb-8">
            <div className="space-y-3">
              {remaining.map((player, index) => {
                const place = index + 4; // Since top 3 are shown above
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-white bg-opacity-20 rounded-xl p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-quiz-purple text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                        {place}
                      </div>
                      <div className="text-2xl">{player.avatar}</div>
                      <span className="text-white font-semibold">
                        {player.name}
                      </span>
                    </div>
                    <span className="text-white font-bold text-xl">
                      {player.score.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Host Control */}
        {gameState.isHost && (
          <div className="text-center">
            <Button
              onClick={nextQuestion}
              disabled={!isConnected}
              className="bg-white text-quiz-purple px-12 py-4 text-xl font-bold hover:shadow-lg transition-shadow"
            >
              <ArrowRight className="w-6 h-6 mr-3" />
              Next Question
            </Button>
          </div>
        )}

        {/* Player Status */}
        {!gameState.isHost && (
          <div className="text-center">
            <div className="text-white text-lg opacity-90">
              Waiting for host to continue...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
