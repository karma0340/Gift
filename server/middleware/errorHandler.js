// Error handling middleware
function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    // Only log the full stack trace for actual server errors (500+)
    // 404s (Not Found) are normal and shouldn't clutter the terminal
    if (statusCode >= 500) {
        console.error('❌ Critical Error:', err.message);
        console.error('Stack:', err.stack);
    } else {
        console.warn(`⚠️ Warning (${statusCode}):`, err.message);
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

// Custom error class
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

module.exports = { errorHandler, AppError };
