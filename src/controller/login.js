import { getUserDetails } from '../util/authController.js';
import { validUser, updateToken, getToken } from '../util/loginHandler.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
export async function login(req, res, next) {
  const { email, password } = req.body;

  try {
    const userData = await getUserDetails(email);

    if (!userData) {
      return next(new EasyQError(
        'AuthenticationError',
        httpStatusCode.UNAUTHORIZED,
        true,
        'User not found.'
      ));
    }

    const token = await getToken(userData);
    const valid = await validUser(password, userData.passwordHash)

    if (!valid) {
      return next(new EasyQError(
        'AuthenticationError',
        httpStatusCode.UNAUTHORIZED,
        true,
        'Invalid credentials.'
      ));
    }
    await updateToken(token, userData.userId);
    res.status(httpStatusCode.OK).send({ token: token });
  } catch (error) {
    next(error);
  }
}