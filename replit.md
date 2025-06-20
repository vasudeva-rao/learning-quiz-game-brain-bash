# QuizMaster Game Application

## Overview

QuizMaster is a real-time quiz application built with React, Express, and WebSocket technology. It allows users to create and host quiz games, join games using room codes, and compete in real-time trivia sessions. The application features a modern UI with Tailwind CSS and shadcn/ui components, providing an engaging quiz experience similar to popular quiz platforms.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom quiz-themed color schemes
- **UI Components**: shadcn/ui component library for consistent design
- **State Management**: React hooks and context for local state, TanStack Query for server state
- **Routing**: wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket client for live game interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Real-time**: WebSocket server using the 'ws' library
- **Data Validation**: Zod schemas for type-safe data validation
- **Development**: tsx for TypeScript execution in development

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in shared directory for type safety across client/server
- **Migrations**: Drizzle migrations with push-based deployment
- **Connection**: Configured for Neon serverless PostgreSQL

## Key Components

### Game Flow Management
The application manages multiple game states through a centralized state machine:
- **Home**: Initial landing page with create/join options
- **Host Dashboard**: Game creation and question management interface
- **Join Game**: Player entry point with room code input
- **Game Lobby**: Pre-game waiting area showing connected players
- **Gameplay**: Active quiz question interface with real-time responses
- **Question Results**: Answer breakdown and scoring display
- **Scoreboard**: Current standings between questions
- **Final Results**: End-game results and winner announcement

### Real-time Communication
WebSocket implementation handles:
- Player joining/leaving game rooms
- Question broadcasting to all players
- Answer submission and validation
- Live score updates and game state synchronization
- Host controls for game progression

### Database Schema
Core entities include:
- **Users**: Basic user authentication (placeholder implementation)
- **Games**: Game metadata, settings, and status tracking
- **Questions**: Quiz questions with multiple choice answers
- **Players**: Game participants with scores and avatars
- **PlayerAnswers**: Individual response tracking with timing data

### UI/UX Design
- Quiz-themed color palette with purple, blue, green, red gradients
- Responsive design optimized for both desktop and mobile devices
- Accessibility-focused components from Radix UI primitives
- Toast notifications for user feedback
- Loading states and error handling throughout the application

## Data Flow

### Game Creation Flow
1. Host navigates to dashboard and creates game with questions
2. Server generates unique room code and stores game data
3. Host receives room code and can start accepting players
4. Game enters lobby state awaiting player connections

### Player Join Flow
1. Player enters room code and personal information
2. Server validates room code and adds player to game
3. WebSocket connection established for real-time updates
4. Player appears in lobby for all participants

### Question Gameplay Flow
1. Host initiates question start via WebSocket
2. Server broadcasts question data to all connected players
3. Players submit answers within time limit
4. Server calculates scores and broadcasts results
5. Scoreboard displays updated standings

### Game Progression
1. Host controls transition between questions
2. Final question triggers game completion
3. Results calculated and winner determined
4. Option to replay or return to main menu

## External Dependencies

### Core Framework Dependencies
- React ecosystem: react, react-dom, @vitejs/plugin-react
- Routing: wouter for lightweight navigation
- HTTP client: TanStack Query for server state management
- WebSocket: native WebSocket API for real-time features

### UI and Styling
- Tailwind CSS with PostCSS for styling pipeline
- Radix UI primitives for accessible component foundation
- Lucide React for consistent iconography
- class-variance-authority for component variant management

### Backend Infrastructure
- Express.js for HTTP server and API endpoints
- ws library for WebSocket server implementation
- Drizzle ORM with @neondatabase/serverless for database
- Zod for runtime type validation and schema generation

### Development Tools
- TypeScript for type safety across the stack
- tsx for TypeScript execution in development
- ESBuild for production server bundling
- Vite plugins for enhanced development experience

## Deployment Strategy

### Build Process
- **Development**: `npm run dev` starts both client and server with hot reload
- **Production Build**: `npm run build` creates optimized client bundle and server bundle
- **Server Bundle**: ESBuild creates single file server executable

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Neon PostgreSQL serverless configured for production scaling
- WebSocket server automatically adapts to HTTP/HTTPS protocols

### Hosting Requirements
- Node.js runtime environment
- PostgreSQL database (Neon serverless recommended)
- WebSocket support for real-time features
- Static file serving for client assets

### Replit Specific Configuration
- `.replit` file configures Node.js 20, web, and PostgreSQL modules
- Deployment target set to autoscale for production
- Port 5000 mapped to external port 80
- Development workflow with automatic server restart

## Changelog

Changelog:
- June 20, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.