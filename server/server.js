const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const giftcardRoutes = require('./routes/giftcards');
const adminRoutes = require('./routes/admin');

const app = express();

// ========== SECURITY MIDDLEWARE ==========

// 1. Security headers (Harden Helmet)
app.use(helmet());

// 2. Prevent NoSQL Injection
app.use(mongoSanitize());

// 3. Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', globalLimiter);

// 4. Secure CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, 'https://cryptogift-murex.vercel.app'] 
        : true, // Allow all in dev for easier testing
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing (Limit payload size to prevent DOS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ========== DATABASE CONNECTION ==========

let cachedDb = null;
const connectDB = async () => {
    if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;

    try {
        if (!process.env.MONGODB_URI) {
            console.warn('⚠️ MONGODB_URI is missing. Database features will not work.');
            return null;
        }

        const db = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        });
        
        cachedDb = db;
        console.log('✅ MongoDB connected successfully');
        return db;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        return null;
    }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// ========== ROUTES ==========

// Health check (Minimal exposure)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// API routes
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/giftcards', giftcardRoutes);
app.use('/api/admin', adminRoutes);

// Root handling (Secure generic response)
app.get('/', (req, res) => {
    res.json({ success: true, message: 'API is online' });
});

app.get('/api', (req, res) => {
    res.json({ success: true, message: 'API is online' });
});

// Error handler
app.use(errorHandler);

// Start server locally
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    const PORT = config.port || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Secure Server: http://localhost:${PORT}`);
    });
}

module.exports = app;
