
import jwt from 'jsonwebtoken'
export async function TokenGenerator(data){
    try{
        
     const token=jwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60),data: data}, 'secret');
     return token
    }catch(e){
    throw new Error(e)
    };
}

export async function compareToken(token){
    try{
   const decoded = jwt.verify(token, 'secret')
     return decoded
    }catch(e){
     throw new Error(e)
    }
}
