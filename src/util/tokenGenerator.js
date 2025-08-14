
import jwt from 'jsonwebtoken'

export async function TokenGenerator(data){
    try{
        
     const token=jwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60),data: data}, 'secret');
     return token
    }catch(e){
    throw new Error(e)
    };
}

export function generateToken(data) {
    try {
        const token = jwt.sign(
            { 
                exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
                data: data 
            }, 
            process.env.JWT_SECRET || 'secret'
        );
        return token;
    } catch (error) {
        throw new Error('Failed to generate token: ' + error.message);
    }
}

export async function compareToken(token){
    try{
   const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
     return decoded
    }catch(e){
     throw new Error(e)
    }
}
