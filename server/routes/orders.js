const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { AppError } = require('../middleware/errorHandler');
const crypto = require('crypto');

/**
 * GET /api/orders
 * Get all orders (optionally filter by email)
 */
router.get('/', async (req, res, next) => {
    try {
        const { email, status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (email) query.email = email.toLowerCase();
        if (status) query.status = status;

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: {
                orders: orders.map(order => ({
                    orderId: order.orderId,
                    brand: order.brand,
                    amount: order.amount,
                    currency: order.currency,
                    crypto: {
                        currency: order.crypto.currency,
                        amount: order.crypto.amount,
                    },
                    status: order.status,
                    giftCardCode: order.status === 'completed' ? order.giftCardCode : null,
                    createdAt: order.createdAt,
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/orders/:orderId/email
 * Update the customer email on an existing order
 */
router.patch('/:orderId/email', async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, error: 'Valid email is required' });
        }

        const order = await Order.findOneAndUpdate(
            { orderId },
            { email: email.toLowerCase().trim() },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        res.json({ success: true, data: { orderId: order.orderId, email: order.email } });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/orders
 * Create a new order and assign the admin's static wallet
 */
router.post('/', async (req, res, next) => {
    try {
        const {
            brandId,
            brandName,
            amount,
            currency,
            cryptoCurrency,
            email,
        } = req.body;

        // Validation
        if (!brandId || !brandName || !amount || !currency || !cryptoCurrency || !email) {
            throw new AppError('Missing required fields', 400);
        }

        if (amount <= 0) {
            throw new AppError('Amount must be greater than 0', 400);
        }

        // Map generic UI symbols to specific wallet identifiers
        const cryptoMap = {
            BTC: 'btc',
            ETH: 'eth',
            USDT: 'usdttrc20',
            SOL: 'sol',
            BNB: 'bnb',
        };
        const mappedCurrency = cryptoMap[cryptoCurrency.toUpperCase()] || cryptoCurrency.toLowerCase();

        // 1. Fetch Admin Settings to get the configured wallet address
        const settings = await Settings.findOne() || new Settings();
        const activeWallet = settings.walletAddresses.find(w => 
            w.currency.toLowerCase() === mappedCurrency.toLowerCase() && w.enabled
        );

        if (!activeWallet || !activeWallet.address) {
            return res.status(400).json({ 
                success: false, 
                error: `Deposits for ${cryptoCurrency.toUpperCase()} are currently disabled by the administrator.` 
            });
        }

        // 2. Live Exchange Rate Calculation via Binance Oracle
        let rate = 1.0;
        const normalizedCrypto = cryptoCurrency.toLowerCase();
        
        // Use a static fallback in case the exchange API goes offline
        const fallbackRates = { btc: 0.000015, eth: 0.00032, usdttrc20: 1.0, usdt: 1.0, sol: 0.0068, bnb: 0.0016 };

        if (!normalizedCrypto.includes('usdt')) {
            try {
                // Determine trading pair (e.g. BTC -> BTCUSDT)
                const symbol = cryptoCurrency.toUpperCase() + 'USDT';
                
                // Fetch live market data (this feature is completely free, no API keys necessary from Binance)
                // Using global fetch (assuming Node 18+)
                const resp = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
                if (resp.ok) {
                    const data = await resp.json();
                    if (data && data.price) {
                        // rate is 1 USD / price in crypto
                        rate = 1 / parseFloat(data.price);
                    } else {
                        throw new Error('Invalid price data');
                    }
                } else {
                    throw new Error(`Binance returned ${resp.status}`);
                }
            } catch (err) {
                console.error(`[Oracle] Live price fetch failed for ${cryptoCurrency}, falling back to static rates:`, err.message);
                rate = fallbackRates[normalizedCrypto] || 0.01;
            }
        }

        const estimatedCryptoAmount = (parseFloat(amount) * rate).toFixed(8);

        // 3. Create the Order securely linked to the Admin's configured Wallet Address
        const randomPaymentId = 'direct_' + crypto.randomBytes(8).toString('hex');
        
        // 4. Also fetch the Fiat Settlement wallet for MoonPay (credit card) redirects
        const moonpayNetworkMap = {
            btc: 'btc', eth: 'eth', usdttrc20: 'usdt_trx', usdterc20: 'usdt',
            sol: 'sol', bnb: 'bnb_bsc', ltc: 'ltc'
        };
        const fiatCurrency = settings.fiatSettlementCurrency || 'usdttrc20';
        const fiatWallet = settings.walletAddresses.find(w =>
            w.currency.toLowerCase() === fiatCurrency.toLowerCase() && w.enabled
        );
        const fiatSettlement = {
            currency: fiatCurrency,
            moonpayCode: moonpayNetworkMap[fiatCurrency] || fiatCurrency,
            address: fiatWallet?.address || activeWallet.address,
        };
        
        const order = new Order({
            brand: { id: brandId, name: brandName },
            amount,
            currency,
            discountPercent: 0,
            discountedAmount: amount, // zero fees
            processingFee: 0,
            crypto: {
                currency: cryptoCurrency,
                amount: estimatedCryptoAmount.toString(),
                paymentAddress: activeWallet.address,
                paymentId: randomPaymentId
            },
            email,
            status: 'pending',
        });

        await order.save();

        res.status(201).json({
            success: true,
            data: {
                orderId: order.orderId,
                status: order.status,
                payment: {
                    paymentId: randomPaymentId,
                    address: activeWallet.address,
                    amount: estimatedCryptoAmount,
                    currency: cryptoCurrency,
                },
                fiatSettlement: {
                    moonpayCode: fiatSettlement.moonpayCode,
                    address: fiatSettlement.address,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/orders/:orderId/confirm
 * Customer manually notifies they've sent the payment.
 */
router.post('/:orderId/confirm', async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderId });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.status === 'pending') {
            order.status = 'payment_received';
            order.paidAt = new Date();
            await order.save();
        }

        res.json({
            success: true,
            data: {
                orderId: order.orderId,
                status: order.status
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/orders/:orderId
 * Get order details by order ID
 */
router.get('/:orderId', async (req, res, next) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        res.json({
            success: true,
            data: {
                orderId: order.orderId,
                brand: order.brand,
                amount: order.amount,
                currency: order.currency,
                discountedAmount: order.discountedAmount,
                crypto: {
                    currency: order.crypto.currency,
                    amount: order.crypto.amount,
                    address: order.crypto.paymentAddress,
                },
                email: order.email,
                status: order.status,
                giftCardCode: order.status === 'completed' ? order.giftCardCode : null,
                createdAt: order.createdAt,
                completedAt: order.completedAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
