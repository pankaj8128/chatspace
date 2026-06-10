# ChatSpace

A real-time chat application with multiple group messaging rooms, online member trackers, chat history pagination, and a read-only guest browsing mode. Designed with a clean, responsive white UI scheme.

## Tech Stack

- **Frontend:** React (Create React App) + CSS
- **Backend:** Node.js + Express + Socket.io
- **Database:** MongoDB Atlas

## Features

- Sign up & Login (JWT auth)
- Guest Access (Read-only view mode to browse rooms and messages)
- Real-time group messaging via WebSockets (Socket.io)
- Real-time typing status indicators
- Active online users tracker per room
- Chat history pagination ("Load older messages")
- Mobile-responsive layouts with sliding drawer navigation menus
- Clean white UI scheme with standard system fonts

## Local Setup

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas cluster (or local MongoDB)

### 1. Clone

```bash
git clone https://github.com/pankaj8128/chat.git
cd chat
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # then fill in your values
npm install
npm run dev            # runs on http://localhost:5000
```

**`.env` variables:**

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxxx.mongodb.net/?appName=Cluster0
PORT=5000
JWT_SECRET=your_secure_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # then fill in your values if needed
npm install
npm start              # runs on http://localhost:3000
```

**`.env` variables:**

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Project Structure

```
chat/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # MongoDB connection
│   │   ├── controllers/          # Auth, Message, Room controllers
│   │   ├── middleware/           # Auth & Error handling middlewares
│   │   ├── models/               # User, Message & Room schemas
│   │   ├── routes/               # Auth, Message & Room routes
│   │   └── socket/               # socketHandler.js & roomManager.js
│   ├── .env.example
│   └── server.js                 # Express entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/             # AuthPage login/register layouts
│   │   │   ├── Chat/             # ChatRoom, MessageInput, OnlineUsersList, TypingIndicator
│   │   │   └── Layout/           # AppLayout, Sidebar
│   │   ├── context/              # AuthContext & ChatContext
│   │   ├── services/             # Axios api.js & Socket.io client config
│   │   └── styles/               # globals.css & theme styling
│   └── .env.example
└── README.md
```

## Deployment

| Layer | Platform | URL |
|-------|----------|-----|
| Frontend | Vercel | https://chatspace-omega.vercel.app |
| Backend | Render | https://chatspace-xd13.onrender.com |
| Database | MongoDB Atlas | — |

## Author

**Pankaj** — [@pankaj8128](https://github.com/pankaj8128)
