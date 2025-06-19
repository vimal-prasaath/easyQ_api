import { getUserDetails } from '../util/authController.js';
import { validUser, updateToken, getToken } from '../util/loginHandler.js';

export async function login(req, res) {
  const { email, password } = req.body;

  try {
    const userData = await getUserDetails(email);

    if (!userData) {
      return res.status(401).send({ message: 'User not found.' });
    }

    const token = await getToken(userData);
    await updateToken(token, userData.userId);
   const valid = await validUser(password, userData.passwordHash)
   
   if(valid){
     res.status(200).send({ token: token });
   }



  } catch (error) {
    console.error('Login error:', error); 


  }
}