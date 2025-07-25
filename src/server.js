import app from "./app.js";
import { dbConnect } from "./config/dbConnect.js";
import { EasyQError } from "./config/error.js";
import { httpStatusCode } from "./util/statusCode.js";
import { logInfo, logError } from "./config/logger.js";
import dotenv from "dotenv";
import functions from "firebase-functions";

const APP_PORT = process.env.APP_PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

dotenv.config();

dbConnect()
  .then(() => {
    app.listen(APP_PORT, () => {
      const serverUrl =
        NODE_ENV === "production"
          ? `https://api2-cd3vrfxtha-uc.a.run.app` // Use your actual production URL
          : `http://localhost:${APP_PORT}`;
      logInfo(`🚀 EasyQ API Server started successfully`, {
        port: APP_PORT,
        environment: process.env.NODE_ENV || "development",
        url: serverUrl,
        apiDocs: `https://api2-cd3vrfxtha-uc.a.run.app:${APP_PORT}/api-docs`,
      });
    });
  })
  .catch((err) => {
    logError("CRITICAL ERROR: Failed to connect to DB and start server", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logError("UNHANDLED REJECTION! 💥 Shutting down...", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logError("UNCAUGHT EXCEPTION! 💥 Shutting down...", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

export const api = functions.https.onRequest(app);
