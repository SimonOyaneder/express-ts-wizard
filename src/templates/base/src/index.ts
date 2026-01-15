import express, { Request, Response } from "express";
import { Server } from "http";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/**
 * Health check endpoint for monitoring and load balancer probes.
 * @param {Request} _request - Express request object (unused)
 * @param {Response} response - Express response object
 * @returns {void}
 */
app.get("/health", (_request: Request, response: Response): void => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * Root endpoint returning a welcome message.
 * @param {Request} _request - Express request object (unused)
 * @param {Response} response - Express response object
 * @returns {void}
 */
app.get("/", (_request: Request, response: Response): void => {
  response.json({ message: "Welcome to your Express + TypeScript API!" });
});

const server: Server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

/**
 * Gracefully shuts down the server when receiving termination signals.
 * @param {string} signal - The termination signal received
 */
function gracefulShutdown(signal: string): void {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
