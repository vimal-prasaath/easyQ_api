class EasyQError extends Error {
    constructor(name, statusCode, isOperational,description,details) {
        super(description);
        this.name = name;
        this.statusCode = statusCode;
        this.description = description;
        this.isOperational = isOperational;
        this.details = details
        Error.captureStackTrace(this, this.constructor);
    }
}
export { EasyQError };