
import QAEntry from '../model/qaEntry.js';
import { EasyQError } from '../config/error.js'; 
import { httpStatusCode } from '../util/statusCode.js'

export async function createQA(req, res , next) {
       const { question, answer, category, tags } = req.body;
    try {
        if (!question || !answer) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Question and Answer are required fields.'
            ));
        }

        const existingQA = await QAEntry.findOne({ question: question });
        if (existingQA) {
            return next(new EasyQError(
                'ConflictError',
                httpStatusCode.BAD_REQUEST,
                true,
                'A Q&A with this question already exists.'
            ));
        }

        const qaEntry = new QAEntry({
            question,
            answer,
            category,
            tags: tags ? tags.map(tag => tag.toLowerCase()) : [],
        });

        const createdQA = await qaEntry.save();
        res.status(httpStatusCode.CREATED).json({
            message: 'Q&A entry created successfully.',
            qa: createdQA
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
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to create Q&A entry: ${error.message}`
        ));
    }

};

export async function getQAs(req, res , next) {
     try {
        const qas = await QAEntry.find().sort({ createdAt: -1 });
        const totalQAs = await QAEntry.countDocuments({});

        res.status(httpStatusCode.OK).json({
            message: 'Q&A entries retrieved successfully.',
            total: totalQAs,
            qas
        });
    } catch (error) {
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to retrieve Q&A entries: ${error.message}`
        ));
    }
}

export async function updateQA(req, res , next){
    const { question, answer, category, tags } = req.body;
    try {
        const qa = await QAEntry.findById(req.params.id);

        if (!qa) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Q&A entry not found.'
            ));
        }

        if (question && question !== qa.question) {
            const existingQA = await QAEntry.findOne({ question: question, _id: { $ne: qa._id } });
            if (existingQA) {
                return next(new EasyQError(
                    'ConflictError',
                    httpStatusCode.CONFLICT,
                    true,
                    'A Q&A with this question already exists.'
                ));
            }
        }

        qa.question = question || qa.question;
        qa.answer = answer || qa.answer;
        qa.category = category ? category.toLowerCase() : qa.category;
        qa.tags = tags ? tags.map(tag => tag.toLowerCase()) : qa.tags;

        const updatedQA = await qa.save();
        res.status(httpStatusCode.OK).json({
            message: 'Q&A entry updated successfully.',
            qa: updatedQA
        });
    } catch (error) {
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Q&A ID format: ${req.params.id}`
            ));
        }
        if (error.name === 'ValidationError' && error.errors) {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                messages.join('; ')
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to update Q&A entry: ${error.message}`
        ));
    }
};

export async function deleteQA(req, res ,next) {
  try {
        const qa = await QAEntry.findById(req.params.id);

        if (!qa) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Q&A entry not found.'
            ));
        }

        await qa.deleteOne();
        res.status(httpStatusCode.OK).json({ message: 'Q&A entry deleted successfully.' });
    } catch (error) {
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Q&A ID format: ${req.params.id}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to delete Q&A entry: ${error.message}`
        ));
    }
};

