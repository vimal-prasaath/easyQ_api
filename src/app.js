import express from 'express';
import apiRoutes from './routes/index.js';
import session from 'express-session';
import passport from './config/passport.js';
import authenticate from './middleware/auth.js';
import dotenv from 'dotenv';
import sign from "./routes/sign/index.js";
import login from './routes/login/index.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger.js';
import './config/sheduler.js'
import { EasyQError } from "./config/error.js";
import { httpStatusCode } from './util/statusCode.js';
import helmet from 'helmet';
import cors from 'cors';
dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.disable('x-powered-by');
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
         secure: process.env.NODE_ENV === 'production', 
        httpOnly: true, 
        sameSite: 'lax',
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());


// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Public routes
app.use('/signup', sign);
app.use('/login', login);

app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.send("Hello")
    }
);

// Protected API routes
app.use('/api', authenticate, apiRoutes);

app.use((req, res, next) => {
    next(new EasyQError(
        'NotFoundError',
        httpStatusCode.NOT_FOUND,
        true, 
        `Cannot find ${req.originalUrl} on this server!`
    ));
});

app.use((err, req, res, next) => {
    if (err.stack) {
        console.error('Stack Trace:', err?.stack);
    }

    if (err instanceof EasyQError && err?.isOperational) {
        return res.status(err.statusCode).json({
            status: 'error',
            statusCode: err.statusCode,
            message: err.description,
            name: err.name
        });
    } else {
        return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            statusCode: httpStatusCode.INTERNAL_SERVER_ERROR,
            message: 'An unexpected internal server error occurred.',
        });
    }
});

export default app;