// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";
import logger from "./utils/logger";

const app = express();

// Security & parsing
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined", { stream: { write: (message) => logger.http(message.trim()) } }));

// ---- CORS setup ----
// Read comma-separated origins from env (CORS_ORIGINS)
// Example: "https://your-frontend.vercel.app,https://another.vercel.app"
const rawOrigins = process.env.CORS_ORIGINS || "";
const allowedOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// sensible defaults for local dev if none provided
if (allowedOrigins.length === 0) {
  allowedOrigins.push("http://localhost:5173", "http://localhost:3000");
}

// function-based origin check so we can return precise headers (needed for credentials)
const corsOptions: cors.CorsOptions = {
  origin: (incomingOrigin, callback) => {
    // allow requests with no origin (e.g. curl, server-to-server)
    if (!incomingOrigin) return callback(null, true);

    if (allowedOrigins.indexOf(incomingOrigin) !== -1) {
      return callback(null, true);
    }

    // deny and log
    logger.warn(`CORS blocked origin: ${incomingOrigin}`);
    return callback(new Error(`CORS: origin ${incomingOrigin} not allowed`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // handle preflight for all routes

// health check
app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// API routes (unchanged)
app.use("/api", routes);

// global error handler (keep as you had it)
app.use(errorHandler);

export default app;
