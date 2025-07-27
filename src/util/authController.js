import User from "../model/userProfile.js"
import bcrypt from 'bcrypt'
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
export async function getUserDetails(phoneNumber) {
  try {
    const user = await User.findOne({ phoneNumber:phoneNumber })
    return user
  } catch (error) {
    throw new EasyQError(
      'DatabaseError',
      httpStatusCode.INTERNAL_SERVER_ERROR,
      false,
      `Failed to retrieve user details from database: ${error.message}`
    );

  }
}

export async function isUser(password, hash) {
  try {
    const match = await bcrypt.compare(password, hash)
    return match
  } catch (error) {
    throw new EasyQError(
      'BcryptError',
      httpStatusCode.INTERNAL_SERVER_ERROR,
      false,
      `Password comparison failed unexpectedly: ${error.message}`
    );
  }
}

export async function generatePasswordHash(plainPassword) {
  try {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    return hashedPassword;

  } catch (error) {
    throw new EasyQError(
      'BcryptError',
      httpStatusCode.INTERNAL_SERVER_ERROR,
      false,
      `Password hashing failed unexpectedly: ${error.message}`
    );
  }
}

export async function createUser(phoneNumber) {
  try{
    const user = await User.create({ phoneNumber:phoneNumber })
    return user
  }catch(error){
     throw new EasyQError(
      'DatabaseError',
      httpStatusCode.INTERNAL_SERVER_ERROR,
      false,
      `Failed to create user in database: ${error.message}`
    );
  }
  
}