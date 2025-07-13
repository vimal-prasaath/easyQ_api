export class ResponseFormatter {
    static cleanMongoData(data) {
        if (!data) return data;

        if (Array.isArray(data)) {
            return data.map(item => this.cleanSingleDocument(item));
        }

        return this.cleanSingleDocument(data);
    }

    static cleanSingleDocument(doc) {
        if (!doc) return doc;

        const cleanDoc = doc.toObject ? doc.toObject() : { ...doc };

        delete cleanDoc._id;
        delete cleanDoc.__v;

        return cleanDoc;
    }

    static formatSuccessResponse({ 
        success = true, 
        message, 
        data = null, 
        meta = null, 
        statusCode = 200 
    }) {
        const response = {
            success,
            message,
            ...(data && { data: this.cleanMongoData(data) }),
            ...(meta && { meta }),
            timestamp: new Date().toISOString()
        };

        return response;
    }

    static formatPaginationMeta(currentPage, limit, total) {
        return {
            currentPage: parseInt(currentPage),
            totalPages: Math.ceil(total / limit),
            totalRecords: total,
            limit: parseInt(limit),
            hasNextPage: currentPage < Math.ceil(total / limit),
            hasPreviousPage: currentPage > 1
        };
    }

    static getSelectFields(additionalFields = '') {
        let selectString = '-_id -__v';
        if (additionalFields) {
            selectString += ` ${additionalFields}`;
        }
        return selectString;
    }

    static formatErrorResponse(message, type = 'Error', statusCode = 500, isOperational = false) {
        return {
            success: false,
            error: {
                type,
                message,
                statusCode,
                isOperational
            },
            timestamp: new Date().toISOString()
        };
    }

}

export function constructResponse(success, statusCode, message, data, meta = null) {
    return ResponseFormatter.formatSuccessResponse({
        success,
        message,
        data,
        meta,
        statusCode 
    });
}