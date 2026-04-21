const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const rateLimit = require('express-rate-limit');
const adminAuth = require('../middleware/adminAuth');

// Optional: Hardcoded dev password for now. Should use bcrypt and DB in production.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';

// Strict rate limiting for login attempts
const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 login attempts per hour
    message: { success: false, error: 'Too many login attempts. Please try again in an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// @route   POST /api/admin/login
// @desc    Admin login to get JWT token
// @access  Public
router.post('/login', loginLimiter, (req, res) => {
    try {
        const { password } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Create JWT payload
        const payload = {
            role: 'admin',
            timestamp: Date.now()
        };

        // Sign token
        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({ success: true, token });
            }
        );
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @route   GET /api/admin/orders
// @desc    Get all orders (with pagination and optional status filter)
// @access  Private (Admin only)
router.get('/orders', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;

        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 }) // Newest first
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get admin orders error:', error);
        res.status(500).json({ success: false, error: 'Server Error fetching orders' });
    }
});

// @route   PUT /api/admin/orders/:id/fulfill
// @desc    Manually fulfill an order by providing the gift card code
// @access  Private (Admin only)
router.put('/orders/:id/fulfill', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { giftCardCode, giftCardPin } = req.body;

        if (!giftCardCode) {
            return res.status(400).json({ success: false, error: 'Gift card code is required to fulfill.' });
        }

        const order = await Order.findOne({ orderId: id });

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        if (order.status === 'completed') {
            return res.status(400).json({ success: false, error: 'Order is already completed.' });
        }

        // Update the order
        order.status = 'completed';
        order.giftCardCode = giftCardCode;
        order.giftCardPin = giftCardPin || null;
        order.completedAt = Date.now();

        await order.save();

        // Send email notification
        const emailService = require('../services/emailService');
        try {
            await emailService.sendGiftCardEmail(order);
        } catch (emailErr) {
            console.error('Failed to send fulfillment email:', emailErr.message);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            message: 'Order fulfilled successfully',
            data: order
        });
    } catch (error) {
        console.error('Fulfill order error:', error);
        res.status(500).json({ success: false, error: 'Server Error fulfilling order' });
    }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard stats
// @access  Private (Admin only)
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: { $in: ['pending', 'payment_received', 'processing'] } });
        const completedOrders = await Order.countDocuments({ status: 'completed' });

        // Calculate Revenue (simple sum of USD amounts)
        const completedDocs = await Order.find({ status: 'completed' }, 'discountedAmount');
        const revenue = completedDocs.reduce((sum, order) => sum + (order.discountedAmount || 0), 0);

        res.json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                completedOrders,
                revenue
            }
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ success: false, error: 'Server Error fetching stats' });
    }
});

// @route   GET /api/admin/settings
// @desc    Get current wallet/payout settings
// @access  Private (Admin only)
router.get('/settings', adminAuth, async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, error: 'Server Error fetching settings' });
    }
});

// @route   PUT /api/admin/settings/wallets
// @desc    Update wallet addresses and fiat settlement settings
// @access  Private (Admin only)
router.put('/settings/wallets', adminAuth, async (req, res) => {
    try {
        const { walletAddresses, fiatSettlementCurrency, upiId, upiQrImageUrl, cardInstructions } = req.body;

        if (!Array.isArray(walletAddresses)) {
            return res.status(400).json({ success: false, error: 'walletAddresses must be an array' });
        }

        const settings = await Settings.getSettings();
        settings.walletAddresses = walletAddresses;
        if (fiatSettlementCurrency) {
            settings.fiatSettlementCurrency = fiatSettlementCurrency;
        }
        
        // Update new direct payment fields
        settings.upiId = upiId || '';
        settings.upiQrImageUrl = upiQrImageUrl || '';
        settings.cardInstructions = cardInstructions || '';

        settings.updatedAt = new Date();
        await settings.save();

        res.json({ success: true, message: 'Wallet addresses updated successfully', data: settings });
    } catch (error) {
        console.error('Update wallet settings error:', error);
        res.status(500).json({ success: false, error: 'Server Error updating settings' });
    }
});

// @route   GET /api/admin/settings/wallets/public
// @desc    Get enabled wallet addresses (public, used on checkout page)
// @access  Public
router.get('/settings/wallets/public', async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        const publicWallets = settings.walletAddresses
            .filter(w => w.enabled && w.address)
            .map(w => ({ currency: w.currency, label: w.label, address: w.address, network: w.network }));
            
        res.json({ 
            success: true, 
            data: {
                wallets: publicWallets,
                upiId: settings.upiId,
                upiQrImageUrl: settings.upiQrImageUrl,
                cardInstructions: settings.cardInstructions
            }
        });
    } catch (error) {
        console.error('Get public wallets error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

module.exports = router;
