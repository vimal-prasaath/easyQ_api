import User from "../model/userProfile.js"
import { generatePasswordHash } from '../util/authController.js'
import { EasyQError } from "../config/error.js"
import { httpStatusCode } from "../util/statusCode.js";
export async function signUp(req, res, next) {
  try {
    let data = req.body;

    if (!data.email || !data.password) {
      return next(new EasyQError(
        'ValidationError',
        httpStatusCode.BAD_REQUEST,
        true,
        'Email and password are required for registration.'
      ));
    }
    if (data.password.length <= 4) {
      return next(new EasyQError(
        'ValidationError',
        httpStatusCode.BAD_REQUEST,
        true,
        'Password must be at least 7 characters long.'
      ));
    }
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return next(new EasyQError(
        'DuplicateError',
        httpStatusCode.BAD_REQUEST,
        true,
        'User with this email already exists.'
      ));
    }

    data["passwordHash"] = await generatePasswordHash(req.body["password"])
    delete data.password;
    const newUser = await User.create(data)
    res.status(httpStatusCode.CREATED).json({
            status: "success", 
            statusCode:httpStatusCode.CREATED,
            message: "User registered successfully!",
            data: {
                userId: newUser.userId,
                email: newUser.email,
            }
        });
  } catch (error) {
    if (error.name === 'ValidationError' && error.errors) {
      const messages = Object.values(error.errors).map(val => val.message);
      return next(new EasyQError(
        'ValidationError',
        httpStatusCode.BAD_REQUEST,
        true,
        messages.join('; ')
      ));
    }
    next(error);
  }

}