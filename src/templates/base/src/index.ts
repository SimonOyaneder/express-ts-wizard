import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/**
 * Health check endpoint for monitoring and load balancer probes.
 * @param {Request} _request - Express request object (unused)
 * @param {Response} response - Express response object
 */
app.get("/health", (_request: Request, response: Response) => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * Root endpoint returning a welcome message.
 * @param {Request} _request - Express request object (unused)
 * @param {Response} response - Express response object
 */
app.get("/", (_request: Request, response: Response) => {
  response.json({ message: "Welcome to your Express + TypeScript API!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
