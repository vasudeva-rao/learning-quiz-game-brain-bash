# 🧠 Brain Bash – Learning Quiz Game

A full-stack multiplayer quiz game that makes learning fun and competitive! Built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- Host can create games with customizable questions (MCQ, True/False).
- Real-time gameplay with scores based on correctness and speed and negative score for wrong answers.
- Passcode-protected games with player avatars and nicknames.
- Live scoreboard between rounds and final rankings.
- Mobile and desktop friendly.
- Host history, player late join/early exit tracking.

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Real-time**: Socket.IO _(planned)_
- **Deployment**: _(To be updated)_

## 📁 Folder Structure

```
brain-bash/
├── client/           # React frontend
├── server/           # Node.js backend (Express)
├── .gitignore
├── README.md
└── package.json      # Root scripts (optional)
```

## Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/vasudeva-rao/learning-quiz-game-brain-bash.git
cd learning-quiz-game-brain-bash
```

### 2. Install Dependencies

#### Frontend

```bash
cd client
npm install
```

#### Backend

```bash
cd ../server
npm install
```

### 3. Start Development

From the root directory:

```bash
npm run dev
```

> This runs both client and server concurrently (requires setup in root `package.json` using `concurrently`).

## License

MIT License. Feel free to use and build on top of this!

---

## 🤝 Contributions

Pull requests are welcome! Please fork the repository and open a PR from a feature branch.  
Direct pushes to `main` are restricted — use PRs and request review.

## 🎨 UI/UX Design

View the Figma designs for Brain Bash here:  
https://www.figma.com/design/ekmdNSEqHMuhvsulSjlePW/Quiz-Game?node-id=0-1&p=f&t=0UUriLuHr0qhXfnG-0
