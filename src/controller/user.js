

import express from "express";
import { UserService } from '../services/userService.js';
import { ResponseFormatter } from '../util/responseFormatter.js';
import { httpStatusCode } from '../util/statusCode.js';
export const getAllUser = async (req, res, next) => {
  try {
    const users = await UserService.getAllUsers();
    
    const response = ResponseFormatter.formatSuccessResponse({
      message: "Users retrieved successfully",
      data: { users },
      meta: { count: users.length },
      statusCode: httpStatusCode.OK
    });
    
    res.status(httpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const updatedUser = await UserService.updateUser(userId, updateData);
    
    const response = ResponseFormatter.formatSuccessResponse({
      message: "User updated successfully",
      data: { user: updatedUser },
      statusCode: httpStatusCode.OK
    });
    
    res.status(httpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
}
export const finduser = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await UserService.getUserById(userId);
    
    const response = ResponseFormatter.formatSuccessResponse({
      message: "User found successfully",
      data: { user },
      statusCode: httpStatusCode.OK
    });
    
    res.status(httpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await UserService.deleteUser(userId);
    
    const response = ResponseFormatter.formatSuccessResponse({
      message: result.message,
      data: { deletedUserId: result.deletedUserId },
      statusCode: httpStatusCode.OK
    });
    
    res.status(httpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
}

export const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const user = await UserService.createUser(userData);
    
    const response = ResponseFormatter.formatSuccessResponse({
      message: "User created successfully",
      data: { user, userId: user.userId },
      statusCode: httpStatusCode.CREATED
    });
    
    res.status(httpStatusCode.CREATED).json(response);
  } catch (error) {
    next(error);
  }
}

export const searchUsers = async (req, res, next) => {
  try {
    const { search, page, limit, sortBy, sortOrder } = req.query;
    const options = { page: Number(page), limit: Number(limit), sortBy, sortOrder };
    
    const result = await UserService.searchUsers(search, options);
    
    const response = ResponseFormatter.formatSuccessResponse({
      message: "Users search completed successfully",
      data: result.users,
      meta: {
        pagination: result.pagination,
        searchQuery: search
      },
      statusCode: httpStatusCode.OK
    });
    
    res.status(httpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
}

export const getUserStats = async (req, res, next) => {
  try {
    const stats = await UserService.getUserStats();
    
    const response = ResponseFormatter.formatSuccessResponse({
      message: "User statistics retrieved successfully",
      data: stats,
      statusCode: httpStatusCode.OK
    });
    
    res.status(httpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
}


export const activateUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const activatedUser = await UserService.activateUser(userId);
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Admin user activated successfully.",
            data: { user: activatedUser },
            statusCode: httpStatusCode.OK
        });
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const resetUserPassword = async (req, res, next) => {
    try {
        const { userId ,password} = req.body;
        const updatedUser = await UserService.resetPassword(userId, password);
        const response = ResponseFormatter.formatSuccessResponse({
            message: "User password reset successfully",
            data: { user: updatedUser },
            statusCode: httpStatusCode.OK
        });
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const getAllInActiveUser = async (req, res, next) => {
    try {
        const inactiveUsers = await UserService.getAllInActiveUsers(); 
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Inactive users retrieved successfully",
            data: { users: inactiveUsers },
            meta: { count: inactiveUsers.length },
            statusCode: httpStatusCode.OK
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error); 
    }
}