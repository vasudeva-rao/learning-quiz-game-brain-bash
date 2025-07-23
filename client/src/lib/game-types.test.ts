import { 
  AVATARS, 
  ANSWER_COLORS, 
  ANSWER_TEXT_COLORS,
  type GameState,
  type WebSocketMessage,
  type QuestionData,
  type PlayerData,
  type GameData
} from './game-types';

describe('Game Types', () => {
  describe('AVATARS', () => {
    it('should contain 12 avatars', () => {
      expect(AVATARS).toHaveLength(12);
    });

    it('should contain valid emoji avatars', () => {
      AVATARS.forEach(avatar => {
        // Simple check that avatar is a string and not empty
        expect(typeof avatar).toBe('string');
        expect(avatar.length).toBeGreaterThan(0);
        // Check that it contains emoji characters (basic check)
        expect(avatar.charCodeAt(0)).toBeGreaterThan(127);
      });
    });
  });

  describe('ANSWER_COLORS', () => {
    it('should contain 4 color classes', () => {
      expect(ANSWER_COLORS).toHaveLength(4);
    });

    it('should contain valid Tailwind color classes', () => {
      ANSWER_COLORS.forEach(color => {
        expect(color).toMatch(/bg-quiz-(red|blue|yellow|green) hover:bg-(red|blue|yellow|green)-600/);
      });
    });
  });

  describe('ANSWER_TEXT_COLORS', () => {
    it('should contain 4 text color classes', () => {
      expect(ANSWER_TEXT_COLORS).toHaveLength(4);
    });

    it('should contain valid Tailwind text color classes', () => {
      ANSWER_TEXT_COLORS.forEach(color => {
        expect(color).toMatch(/text-quiz-(red|blue|yellow|green)/);
      });
    });
  });

  describe('GameState interface', () => {
    it('should allow valid game state types', () => {
      const validStates: GameState['type'][] = [
        'home',
        'host-dashboard',
        'join-game',
        'game-lobby',
        'gameplay',
        'question-results',
        'scoreboard',
        'final-results'
      ];

      validStates.forEach(type => {
        const gameState: GameState = { type };
        expect(gameState.type).toBe(type);
      });
    });
  });

  describe('WebSocketMessage interface', () => {
    it('should allow valid WebSocket messages', () => {
      const message: WebSocketMessage = {
        type: 'test_message',
        payload: { data: 'test' }
      };

      expect(message.type).toBe('test_message');
      expect(message.payload).toEqual({ data: 'test' });
    });
  });

  describe('QuestionData interface', () => {
    it('should allow multiple choice questions', () => {
      const question: QuestionData = {
        id: 1,
        questionText: 'What is 2+2?',
        questionType: 'multiple_choice',
        answers: ['3', '4', '5', '6'],
        correctAnswerIndex: 1,
        questionOrder: 1
      };

      expect(question.questionType).toBe('multiple_choice');
      expect(question.correctAnswerIndex).toBe(1);
    });

    it('should allow multi-select questions', () => {
      const question: QuestionData = {
        id: 2,
        questionText: 'Select all even numbers',
        questionType: 'multi_select',
        answers: ['2', '3', '4', '5'],
        correctAnswerIndices: [0, 2],
        questionOrder: 2
      };

      expect(question.questionType).toBe('multi_select');
      expect(question.correctAnswerIndices).toEqual([0, 2]);
    });

    it('should allow true/false questions', () => {
      const question: QuestionData = {
        id: 3,
        questionText: 'Is the sky blue?',
        questionType: 'true_false',
        answers: ['True', 'False'],
        correctAnswerIndex: 0,
        questionOrder: 3
      };

      expect(question.questionType).toBe('true_false');
      expect(question.answers).toHaveLength(2);
    });
  });

  describe('PlayerData interface', () => {
    it('should allow valid player data', () => {
      const player: PlayerData = {
        id: 1,
        name: 'Test Player',
        avatar: '🥳',
        score: 100,
        isHost: false
      };

      expect(player.name).toBe('Test Player');
      expect(player.score).toBe(100);
      expect(player.isHost).toBe(false);
    });
  });

  describe('GameData interface', () => {
    it('should allow valid game data', () => {
      const game: GameData = {
        id: 1,
        title: 'Test Game',
        description: 'A test game',
        gameCode: 'ABC123',
        timePerQuestion: 30,
        pointsPerQuestion: 10,
        status: 'active',
        currentQuestionIndex: 0
      };

      expect(game.title).toBe('Test Game');
      expect(game.gameCode).toBe('ABC123');
      expect(game.timePerQuestion).toBe(30);
    });
  });
}); 