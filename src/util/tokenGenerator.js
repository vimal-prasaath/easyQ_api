
import jwt from 'jsonwebtoken'

export async function TokenGenerator(data){
    try{
        
     const token=jwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60),data: data}, 'secret');
     return token
    }catch(e){
    throw new Error(e)
    };
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const ACCESS_TOKEN_EXPIRY_SECONDS = parseInt(process.env.JWT_ACCESS_EXPIRY_SECONDS, 10) || 60 * 60;
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export function generateToken(data) {
    try {
        const token = jwt.sign(
            {
                type: 'access',
                exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY_SECONDS,
                data: data
            },
            JWT_SECRET
        );
        return token;
    } catch (error) {
        throw new Error('Failed to generate token: ' + error.message);
    }
}

export function generateRefreshToken(data) {
    try {
        return jwt.sign(
            {
                type: 'refresh',
                data
            },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRY }
        );
    } catch (error) {
        throw new Error('Failed to generate refresh token: ' + error.message);
    }
}

export async function compareToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

export function generateStaffAccessToken(role, data) {
    try {
        return jwt.sign(
            { type: role, data },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
    } catch (error) {
        throw new Error('Failed to generate staff access token: ' + error.message);
    }
}
