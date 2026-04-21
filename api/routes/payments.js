const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const tremendous = require('../services/tremendous');
const emailService = require('../services/emailService');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/payments/simulate
 * Simulates a successful payment detection and triggers the fulfillment flow.
 * Useful for local development and demonstration.
 */
router.post('/simulate', async (req, res, next) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findOne({ orderId });
        if (!order) throw new AppError('Order not found', 404);

        // 1. Mark as payment received
        order.status = 'payment_received';
        order.paidAt = new Date();
        await order.save();

        // 2. Notify Admin
        emailService.sendAdminOrderNotification(order).catch(e =>
            console.error('Admin notification failed:', e.message)
        );

        // 3. Simulate automatic processing and fulfillment after a short delay
        setTimeout(async () => {
            try {
                // If Tremendous is configured, try real fulfillment; otherwise, use mock
                const result = tremendous.mockFulfillment(order.orderId, order.amount);
                
                order.giftCardCode = result.redeemCode;
                order.giftCardPin = result.pinCode;
                order.status = 'completed';
                order.completedAt = new Date();
                await order.save();
                
                // Email the customer their code
                await emailService.sendGiftCardEmail(order);
            } catch (err) {
                console.error('[Simulation] Fulfillment error:', err);
            }
        }, 3000);

        res.json({ 
            success: true, 
            message: 'Payment simulation initiated. Order status updated to payment_received.' 
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Purchase gift card via Tremendous
 * Internal utility to handle automated reward creation
 */
async function purchaseGiftCard(order) {
    try {
        const result = await tremendous.createReward({
            recipientEmail: order.email,
            amount: order.amount,
            orderId: order.orderId
        });

        // If it returns a code (mock or specific integration)
        if (result.redeemCode) {
            order.giftCardCode = result.redeemCode;
            order.giftCardPin = result.pinCode;
            order.status = 'completed';
            order.completedAt = new Date();
            await order.save();
            await emailService.sendGiftCardEmail(order);
        } else {
            // Tremendous typically handles delivery via email themselves for real rewards
            order.status = 'completed';
            order.completedAt = new Date();
            await order.save();
        }
        return result;
    } catch (error) {
        console.error('[Tremendous] Order fulfillment failed:', error.message);
        throw error;
    }
}

module.exports = router;
