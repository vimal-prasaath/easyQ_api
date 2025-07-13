import QAEntry from '../model/qaEntry.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';

export class HelpCenterService {
    
    static async createQA(qaData) {
        try {
            const { question, answer, category, tags } = qaData;

            if (!question || !answer) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Question and Answer are required fields.'
                );
            }

            const existingQA = await QAEntry.findOne({ question: question });
            if (existingQA) {
                throw new EasyQError(
                    'ConflictError',
                    httpStatusCode.CONFLICT,
                    true,
                    'A Q&A with this question already exists.'
                );
            }

            const qaEntry = new QAEntry({
                question,
                answer,
                category,
                tags: tags ? tags.map(tag => tag.toLowerCase()) : [],
            });

            const createdQA = await qaEntry.save();
            return {
                qa: createdQA,
                message: 'Q&A entry created successfully.'
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            if (error.name === 'ValidationError' && error.errors) {
                const messages = Object.values(error.errors).map(val => val.message);
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    messages.join('; ')
                );
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to create Q&A entry: ${error.message}`
            );
        }
    }

    static async getAllQAs(options = {}) {
        try {
            const { page = 1, limit = 10, category, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;
            const skip = (page - 1) * limit;

            const query = {};
            
            if (category) {
                query.category = category;
            }

            if (search) {
                query.$or = [
                    { question: { $regex: search, $options: 'i' } },
                    { answer: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } }
                ];
            }

            const qaEntries = await QAEntry.find(query)
                .select('-_id -__v')
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .skip(skip)
                .limit(limit);

            const totalCount = await QAEntry.countDocuments(query);

            return {
                qaEntries,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    hasNext: page < Math.ceil(totalCount / limit),
                    hasPrev: page > 1
                },
                message: 'Q&A entries retrieved successfully'
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to retrieve Q&A entries: ${error.message}`
            );
        }
    }

    static async getQAById(qaId) {
        try {
            const qaEntry = await QAEntry.findOne({ qaId: qaId }).select('-_id -__v');
            
            if (!qaEntry) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Q&A entry not found.'
                );
            }

            await QAEntry.findOneAndUpdate(
                { qaId: qaId },
                { $inc: { views: 1 } }
            );

            return {
                qa: qaEntry,
                message: 'Q&A entry retrieved successfully'
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to retrieve Q&A entry: ${error.message}`
            );
        }
    }

    static async updateQA(qaId, updateData) {
        try {
            const updatedQA = await QAEntry.findOneAndUpdate(
                { qaId: qaId },
                { $set: updateData },
                { new: true, runValidators: true }
            ).select('-_id -__v');

            if (!updatedQA) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Q&A entry not found.'
                );
            }

            return {
                qa: updatedQA,
                message: 'Q&A entry updated successfully'
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            if (error.name === 'ValidationError' && error.errors) {
                const messages = Object.values(error.errors).map(val => val.message);
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    messages.join('; ')
                );
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to update Q&A entry: ${error.message}`
            );
        }
    }

    static async deleteQA(qaId) {
        try {
            const deletedQA = await QAEntry.findOneAndDelete({ qaId: qaId }).select('-_id -__v');
            
            if (!deletedQA) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Q&A entry not found.'
                );
            }

            return {
                deletedQA,
                message: 'Q&A entry deleted successfully'
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to delete Q&A entry: ${error.message}`
            );
        }
    }

    static async searchQAs(searchTerm, options = {}) {
        try {
            const { limit = 10, category } = options;
            
            const query = {
                $or: [
                    { question: { $regex: searchTerm, $options: 'i' } },
                    { answer: { $regex: searchTerm, $options: 'i' } },
                    { tags: { $in: [new RegExp(searchTerm, 'i')] } }
                ]
            };

            if (category) {
                query.category = category;
            }

            const qaEntries = await QAEntry.find(query)
                .select('-_id -__v')
                .limit(limit)
                .sort({ relevanceScore: -1, views: -1 });

            return {
                qaEntries,
                searchTerm,
                totalResults: qaEntries.length,
                message: 'Q&A search completed successfully'
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to search Q&A entries: ${error.message}`
            );
        }
    }

    static async getPopularQAs(options = {}) {
        try {
            const { limit = 10, category } = options;
            
            const query = {};
            if (category) {
                query.category = category;
            }

            const qaEntries = await QAEntry.find(query)
                .select('-_id -__v')
                .sort({ views: -1, likes: -1 })
                .limit(limit);

            return {
                qaEntries,
                message: 'Popular Q&A entries retrieved successfully'
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to retrieve popular Q&A entries: ${error.message}`
            );
        }
    }

    static async getQAsByCategory(category, options = {}) {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
            const skip = (page - 1) * limit;

            const qaEntries = await QAEntry.find({ category: category })
                .select('-_id -__v')
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .skip(skip)
                .limit(limit);

            const totalCount = await QAEntry.countDocuments({ category: category });

            return {
                qaEntries,
                category,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    hasNext: page < Math.ceil(totalCount / limit),
                    hasPrev: page > 1
                },
                message: `Q&A entries for category '${category}' retrieved successfully`
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to retrieve Q&A entries by category: ${error.message}`
            );
        }
    }

    static async getQAStats() {
        try {
            const totalQAs = await QAEntry.countDocuments();
            const categoriesStats = await QAEntry.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            const mostViewedQAs = await QAEntry.find()
                .select('question views -_id')
                .sort({ views: -1 })
                .limit(5);

            return {
                totalQAs,
                categoriesStats,
                mostViewedQAs,
                message: 'Q&A statistics retrieved successfully'
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to retrieve Q&A statistics: ${error.message}`
            );
        }
    }
}