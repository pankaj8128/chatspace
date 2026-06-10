require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const roomRoutes = require("./src/routes/roomRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const { errorHandler, notFound } = require("./src/middleware/errorHandler");
const { authenticateSocket } = require("./src/middleware/authMiddleware");
const socketHandler = require("./src/socket/socketHandler");

connectDB();

const app = express();

const corsOptions = {
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ success: true, message: "Chat App API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

app.use(notFound);

app.use(errorHandler);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.use(authenticateSocket);

io.on("connection", (socket) => {
  socketHandler(io, socket);
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\nServer running on port ${PORT}`);
  console.log(`REST API: http://localhost:${PORT}/api`);
  console.log(`Socket.io: ws://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}\n`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  httpServer.close(() => process.exit(1));
});
