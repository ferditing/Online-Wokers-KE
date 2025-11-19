// src/server.ts
import "express-async-errors";
import dotenv from "dotenv";
dotenv.config();
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import app from "./app";
import logger from "./utils/logger";
import { initSocket } from "./utils/socket";

const PORT = process.env.PORT || 4000;
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://tingishaferdinand_db_user:IATX5jCI48dIMUW6@cluster0.orim602.mongodb.net/?appName=Cluster0";

// parse allowed origins from same env var (CORS_ORIGINS)
const rawOrigins = process.env.CORS_ORIGINS || "";
const allowedOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// fallback for local dev
const socketOrigins = allowedOrigins.length > 0 ? allowedOrigins : ["http://localhost:5173"];

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: socketOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
});

async function start() {
  try {
    logger.info("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    logger.info("Connected to MongoDB");

    // Initialize socket.io handlers
    initSocket(io);

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Allowed CORS origins: ${socketOrigins.join(", ")}`);
    });
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
