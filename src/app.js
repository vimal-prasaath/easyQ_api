import express from 'express';
import apiRoutes from './routes/index.js';
import session from 'express-session';
import passport from './config/passport.js';
import authenticate from './middleware/auth.js';
import dotenv from 'dotenv';
import sign from "./routes/sign/index.js";
import login from './routes/login/index.js';
import './config/sheduler.js'
dotenv.config();

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());

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

export default app;