import { compareToken } from "../util/tokenGenerator.js";

async function authenticate(req, res, next) {
    //checking by the google OAauth first 
  
    if (req.isAuthenticated) {
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header is missing. Please provide a JWT.' });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Invalid Authorization header format. Must be "Bearer <token>".' });
    }

    const token = tokenParts[1];

    try {
        const decodedPayload = await compareToken(token);
        req.user = decodedPayload;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Authentication failed: Token expired.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Authentication failed: Invalid token.' });
        }
        return res.status(500).json({ message: 'Authentication failed: An unexpected error occurred.' });
    }
}

export default authenticate;