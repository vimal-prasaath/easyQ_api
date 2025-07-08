import { getUserDetails } from '../util/authController.js';
import { validUser, updateToken, getSessionToken } from '../util/loginHandler.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
export async function login(req, res, next) {
  const { email, password } = req.body;

  try {
     if (!email || !password) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true, 
                'Email and password are required for login.'
            ));
        }
    const userData = await getUserDetails(email);

    if (!userData) {
      return next(new EasyQError(
        'AuthenticationError',
        httpStatusCode.UNAUTHORIZED,
        true,
        'User not found.'
      ));
    }

    const valid = await validUser(password, userData.passwordHash)

    if (!valid) {
      return next(new EasyQError(
        'AuthenticationError',
        httpStatusCode.UNAUTHORIZED,
        true,
        'Invalid credentials.'
      ));
    }

    const token = await getSessionToken(userData);
    await updateToken(token, userData.userId);
    res.status(httpStatusCode.OK).json({
            status: "success",
            statusCode: httpStatusCode.OK,
            message: "Login successful",
            data: {
                userId: userData.userId,
                email: userData.email,
                sessionToken: token
            }
        });
  } catch (error) {
    next(error);
  }
}