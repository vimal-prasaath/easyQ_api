class EasyQError extends Error {
    constructor(name, statusCode, isOperational,description) {
        super(description);
        this.name = name;
        this.statusCode = statusCode;
        this.description = description;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
export { EasyQError };