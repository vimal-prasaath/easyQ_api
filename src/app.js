import express from "express";
import helmet from "helmet";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import session from "express-session";
import passport from "./config/passport.js";
import authenticate from "./middleware/auth.js";
import httpLogger from "./middleware/httpLogger.js";
import { sanitizeInput, normalizeInput } from "./middleware/inputSanitizer.js";
import { generalRateLimit, authRateLimit } from "./middleware/rateLimiter.js";
import ValidationErrorHandler from "./util/validationErrorHandler.js";
import dotenv from "dotenv";
import sign from "./routes/sign/index.js";
import login from "./routes/login/index.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "./config/swagger.js";
import "./config/sheduler.js";
import { EasyQError } from "./config/error.js";
import { httpStatusCode } from "./util/statusCode.js";
import { logError, logInfo } from "./config/logger.js";

dotenv.config();

const app = express();

// 1. Security middleware (should be first)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://api2-cd3vrfxtha-uc.a.run.app",
          "http://localhost:3000",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS configuration
app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow localhost, all subdomains, and any origin
      const allowed = [
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        /^https?:\/\/.+$/, // Allow all http/https origins
      ];
      if (allowed.some((re) => re.test(origin))) {
        return callback(null, true);
      }
      return callback(null, true); // fallback: allow all
    },
  })
);
// 3. HTTP request logging (early in stack)
app.use(httpLogger);

// 4. General rate limiting
app.use(generalRateLimit);

// 5. Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 6. Input sanitization and normalization
// app.use(sanitizeInput);
// app.use(normalizeInput);

// 7. Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  })
);

// 8. Passport initialization
app.use(passport.initialize());
app.use(passport.session());



// 10. Public routes with specific rate limiting

app.use("/api/signup", authRateLimit, sign);
app.use("/api/login", authRateLimit, login);
// app.use("/api/user", authRateLimit, login);

// 9. Swagger Documentation (public)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// 11. Google OAuth routes
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    logInfo("Google OAuth success", {
      userId: req.user?.userId,
      email: req.user?.email,
      ip: req.ip,
    });
    res.redirect(process.env.BASE_URL);
  }
);

// 12. API routes (authentication will be applied per route basis)
app.use("/api", apiRoutes);

// 13. Health check endpoint (public)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// 14. 404 handler
app.use((req, res, next) => {
  logError(new Error(`Route not found: ${req.originalUrl}`), {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  next(
    new EasyQError(
      "NotFoundError",
      httpStatusCode.NOT_FOUND,
      true,
      `Cannot find ${req.originalUrl} on this server!`
    )
  );
});

// 15. Global error handler
app.use((err, req, res, next) => {
  // Process the error using our centralized error handler
  const processedError = ValidationErrorHandler.processError(err, req);

  // Log the error with context
  logError(processedError, {
    originalError: err.message,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user?.userId || "anonymous",
    body: req.method !== "GET" ? req.body : undefined,
  });

  // Send formatted error response
  const errorResponse =
    ValidationErrorHandler.formatErrorResponse(processedError);
  res.status(processedError.statusCode || 500).json(errorResponse);
});

export default app;
