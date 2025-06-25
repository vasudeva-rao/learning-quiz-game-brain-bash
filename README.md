# Brain Bash Game Application

## Overview

Brain Bash is a real-time, multiplayer quiz platform inspired by Kahoot, built with React, TypeScript, Express, WebSocket, and MongoDB. It features a modern, responsive UI using shadcn/ui (built on Radix UI primitives) and Tailwind CSS, with smooth CSS-based animations. The app supports game creation, live hosting, player joining via room code, real-time gameplay, scoring, and results.

---

## How to Clone and Run

1. **Clone the repository:**

   ```bash
   git clone https://github.com/vasudeva-rao/learning-quiz-game-brain-bash
   cd learning-quiz-game-brain-bash
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   - Create a `.env` file in the root directory.
   - Add your MongoDB connection string:
     ```env
     MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority
     ```

4. **Run the app in development mode (client + server with hot reload):**

   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   # Then start the server
   npm start
   ```

**Notes:**

- Requires Node.js (v18+ recommended) and a running MongoDB instance (local or cloud, e.g., MongoDB Atlas).
- The server always runs on port 5000 by default.

---

## Architecture

### Frontend

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (custom color schemes, transitions, keyframes)
- **UI Components:** shadcn/ui (built on Radix UI for accessibility and composability)
- **State Management:** React hooks/context, TanStack Query for server state
- **Routing:** wouter (minimal, fast routing)
- **Custom Hooks:**
  - `use-websocket`: Robust WebSocket connection, reconnection, and message handling
  - `use-toast`: Toast notification system
  - `use-mobile`: Responsive/mobile detection
- **Real-time:** WebSocket client for live game state and events
- **Animations:** Tailwind CSS transitions and custom keyframes

### Backend

- **Runtime:** Node.js + Express.js
- **Language:** TypeScript (ES modules)
- **API:** RESTful endpoints for game, player, and question management
- **WebSocket:** Real-time server for game events, player actions, and state sync
- **Database:** MongoDB (persistent storage for all game, player, question, and answer data)
- **Type Safety & Validation:** All core types/interfaces are defined in TypeScript and shared between client and server. Validation is handled via TypeScript and manual checks in the backend.

---

## Main Features

- Create and host quiz games with custom questions
- Join games via unique room code and select an avatar
- Real-time multiplayer gameplay with live question/answering
- Host controls game flow (start, next, end)
- Live scoreboard and results after each question
- Final results and winner announcement
- Game re-hosting and host game history
- Responsive, accessible, and mobile-friendly UI
- Smooth page/component transitions and feedback

---

## UI System

- **shadcn/ui:** Provides styled, accessible React components (Button, Dialog, Popover, Tooltip, etc.)
- **Radix UI:** All shadcn/ui components are built on Radix UI primitives for accessibility and composability
- **Custom Components:** ThemeProvider, ThemeSwitcher, Sidebar, Toaster, etc.
- **Design System:** Consistent color palette, spacing, and typography via Tailwind CSS
- **Animations:** All transitions and effects use Tailwind CSS and custom keyframes

---

## State Management & Hooks

- **Game State:** Centralized in App, passed to all pages
- **WebSocket:**
  - Auto-reconnect, ping/keepalive, handler registration
  - All real-time events (join, leave, question, answer, score, etc.)
- **Toast:** Global notification system
- **Mobile Detection:** Responsive UI adjustments
- **Query Client:** TanStack Query for API data fetching/caching

---

## Database Schema (MongoDB)

### Collections & Fields

- **games**

  - id (ObjectId as string)
  - hostId (string)
  - title (string)
  - description (string, optional)
  - gameCode (string, unique, 6 chars)
  - timePerQuestion (number)
  - pointsPerQuestion (number)
  - status ("lobby" | "active" | "completed")
  - currentQuestionIndex (number)
  - createdAt (ISO string)
  - finalResults (Player[])

- **questions**

  - id (ObjectId as string)
  - gameId (string)
  - questionText (string)
  - questionType ("multiple_choice" | "multi_select" | "true_false")
  - answers (string[])
  - correctAnswerIndex (number, optional)
  - correctAnswerIndices (number[], optional)
  - questionOrder (number)

- **players**

  - id (ObjectId as string)
  - gameId (string)
  - name (string)
  - avatar (string)
  - score (number)
  - joinedAt (ISO string)
  - isHost (boolean)

- **playerAnswers**

  - id (ObjectId as string)
  - playerId (string)
  - questionId (string)
  - selectedAnswerIndex (number, optional)
  - selectedAnswerIndices (number[], optional)
  - answeredAt (ISO string)
  - timeToAnswer (number)
  - pointsEarned (number)

- **users** (optional, not used in main flow)
  - id (string)
  - username (string)
  - password (string)

---

## Real-time Multiplayer (WebSocket)

- All game state, player actions, and results are synchronized via WebSocket
- Robust reconnection, ping/keepalive, and handler system
- Server broadcasts: player join/leave, question start, answer results, score updates, game progression

---

## Utilities & Helpers

- **game-types.ts:** All game, player, and question types for state and WebSocket
- **queryClient.ts:** TanStack Query setup and API helpers
- **utils.ts:** Utility for class name merging (Tailwind)

---

## Deployment & Configuration

- **Development:** `npm run dev` (client and server with hot reload)
- **Production:** `npm run build` (builds client and server bundles)
- **MongoDB:** Requires a running MongoDB instance (local or cloud, e.g., MongoDB Atlas)
- **Environment Variable:** `MONGO_URI` (connection string for MongoDB)
- **Port:** Server runs on port 5000

---
