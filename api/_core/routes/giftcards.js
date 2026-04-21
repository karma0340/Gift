const express = require('express');
const router = express.Router();
const tremendous = require('../services/tremendous');
const { AppError } = require('../middleware/errorHandler');

// Updated categories including the new Travel category
const categories = ['Shopping', 'Gaming', 'Entertainment', 'Food & Delivery', 'Virtual Cards', 'Travel'];

// Professional fallback data synced with frontend expansion
const fallbackProducts = [
    // Shopping
    { id: 'amzn-usd', name: 'Amazon Gift Card', category: 'Shopping', denominations: [10, 25, 50, 100, 200, 500], currency: 'USD', bgGradient: 'linear-gradient(135deg, #232f3e 0%, #131921 100%)', logo: 'https://www.vectorlogo.zone/logos/amazon/amazon-icon.svg' },
    { id: 'flip-inr', name: 'Flipkart Gift Card', category: 'Shopping', denominations: [500, 1000, 2000, 5000], currency: 'INR', bgGradient: 'linear-gradient(135deg, #2874F0 0%, #1a5cc7 100%)', logo: 'https://www.google.com/s2/favicons?domain=flipkart.com&sz=128' },
    { id: 'ebay-usd', name: 'eBay Gift Card', category: 'Shopping', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #E53238 0%, #b22228 100%)', logo: 'https://www.vectorlogo.zone/logos/ebay/ebay-icon.svg' },
    { id: 'walm-usd', name: 'Walmart Gift Card', category: 'Shopping', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #0071DC 0%, #004f9a 100%)', logo: 'https://www.vectorlogo.zone/logos/walmart/walmart-icon.svg' },
    { id: 'targ-usd', name: 'Target Gift Card', category: 'Shopping', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #CC0000 0%, #990000 100%)', logo: 'https://www.vectorlogo.zone/logos/target/target-icon.svg' },
    { id: 'best-usd', name: 'Best Buy Gift Card', category: 'Shopping', denominations: [25, 50, 100, 250], currency: 'USD', bgGradient: 'linear-gradient(135deg, #0046be 0%, #003082 100%)', logo: 'https://www.google.com/s2/favicons?domain=bestbuy.com&sz=128' },
    { id: 'ikea-usd', name: 'IKEA Gift Card', category: 'Shopping', denominations: [25, 50, 100, 200, 500], currency: 'USD', bgGradient: 'linear-gradient(135deg, #0058AB 0%, #00458a 100%)', logo: 'https://www.google.com/s2/favicons?domain=ikea.com&sz=128' },
    { id: 'nike-usd', name: 'Nike Gift Card', category: 'Shopping', denominations: [25, 50, 100, 200], currency: 'USD', bgGradient: 'linear-gradient(135deg, #111111 0%, #333333 100%)', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
    { id: 'adid-usd', name: 'Adidas Gift Card', category: 'Shopping', denominations: [25, 50, 100, 200], currency: 'USD', bgGradient: 'linear-gradient(135deg, #222 0%, #000 100%)', logo: 'https://www.google.com/s2/favicons?domain=adidas.com&sz=128' },
    { id: 'seph-usd', name: 'Sephora Gift Card', category: 'Shopping', denominations: [25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #000 0%, #222 100%)', logo: 'https://www.google.com/s2/favicons?domain=sephora.com&sz=128' },
    
    // Gaming
    { id: 'stem-usd', name: 'Steam Wallet Code', category: 'Gaming', denominations: [10, 20, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)', logo: 'https://www.google.com/s2/favicons?domain=steampowered.com&sz=128' },
    { id: 'psn-usd', name: 'PlayStation Network', category: 'Gaming', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #003087 0%, #00246d 100%)', logo: 'https://www.google.com/s2/favicons?domain=playstation.com&sz=128' },
    { id: 'xbox-usd', name: 'Xbox Live Gold', category: 'Gaming', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #107C10 0%, #0c5e0c 100%)', logo: 'https://www.vectorlogo.zone/logos/xbox/xbox-icon.svg' },
    { id: 'nint-usd', name: 'Nintendo eShop', category: 'Gaming', denominations: [10, 20, 35, 50], currency: 'USD', bgGradient: 'linear-gradient(135deg, #E60012 0%, #b3000e 100%)', logo: 'https://www.google.com/s2/favicons?domain=nintendo.com&sz=128' },
    { id: 'robl-usd', name: 'Roblox Robux', category: 'Gaming', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #393b3d 0%, #1a1a1d 100%)', logo: 'https://www.google.com/s2/favicons?domain=roblox.com&sz=128' },
    { id: 'razr-usd', name: 'Razer Gold', category: 'Gaming', denominations: [10, 20, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #000 0%, #111 100%)', logo: 'https://www.google.com/s2/favicons?domain=razer.com&sz=128' },
    
    // Entertainment
    { id: 'nflx-usd', name: 'Netflix Subscription', category: 'Entertainment', denominations: [15, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #E50914 0%, #b00710 100%)', logo: 'https://www.vectorlogo.zone/logos/netflix/netflix-icon.svg' },
    { id: 'spot-usd', name: 'Spotify Premium', category: 'Entertainment', denominations: [10, 30, 60], currency: 'USD', bgGradient: 'linear-gradient(135deg, #1DB954 0%, #169c46 100%)', logo: 'https://www.vectorlogo.zone/logos/spotify/spotify-icon.svg' },
    { id: 'appl-usd', name: 'Apple Gift Card', category: 'Entertainment', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #333333 0%, #1a1a1a 100%)', logo: 'https://www.vectorlogo.zone/logos/apple/apple-icon.svg' },
    { id: 'goog-usd', name: 'Google Play Code', category: 'Entertainment', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)', logo: 'https://www.vectorlogo.zone/logos/google_play/google_play-icon.svg' },
    { id: 'yout-usd', name: 'YouTube Premium', category: 'Entertainment', denominations: [15, 25, 50], currency: 'USD', bgGradient: 'linear-gradient(135deg, #FF0000 0%, #cc0000 100%)', logo: 'https://www.vectorlogo.zone/logos/youtube/youtube-icon.svg' },
    { id: 'hulu-usd', name: 'Hulu Plus', category: 'Entertainment', denominations: [25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #000 0%, #111 100%)', logo: 'https://www.google.com/s2/favicons?domain=hulu.com&sz=128' },
    { id: 'disn-usd', name: 'Disney+', category: 'Entertainment', denominations: [25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #020b41 0%, #001271 100%)', logo: 'https://www.google.com/s2/favicons?domain=disneyplus.com&sz=128' },
    { id: 'hbo-usd', name: 'HBO Max', category: 'Entertainment', denominations: [25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #000 0%, #31006a 100%)', logo: 'https://www.google.com/s2/favicons?domain=max.com&sz=128' },
    { id: 'disc-usd', name: 'Discord Nitro', category: 'Entertainment', denominations: [10, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #5865F2 0%, #4752c4 100%)', logo: 'https://www.vectorlogo.zone/logos/discord/discord-icon.svg' },
    { id: 'twit-usd', name: 'Twitch Bits', category: 'Entertainment', denominations: [15, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #9146FF 0%, #7b3bd9 100%)', logo: 'https://www.vectorlogo.zone/logos/twitch/twitch-icon.svg' },
    
    // Food & Delivery
    { id: 'uber-usd', name: 'Uber & Uber Eats', category: 'Food & Delivery', denominations: [15, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #276EF1 0%, #1a56c4 100%)', logo: 'https://www.google.com/s2/favicons?domain=uber.com&sz=128' },
    { id: 'dash-usd', name: 'DoorDash Credits', category: 'Food & Delivery', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #FF3008 0%, #d42806 100%)', logo: 'https://www.google.com/s2/favicons?domain=doordash.com&sz=128' },
    { id: 'swig-inr', name: 'Swiggy Money', category: 'Food & Delivery', denominations: [250, 500, 1000, 2000], currency: 'INR', bgGradient: 'linear-gradient(135deg, #FC8019 0%, #e57210 100%)', logo: 'https://www.google.com/s2/favicons?domain=swiggy.com&sz=128' },
    { id: 'star-usd', name: 'Starbucks Card', category: 'Food & Delivery', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #00704A 0%, #004d32 100%)', logo: 'https://www.google.com/s2/favicons?domain=starbucks.com&sz=128' },
    { id: 'domi-usd', name: 'Domino\'s Pizza', category: 'Food & Delivery', denominations: [15, 25, 50], currency: 'USD', bgGradient: 'linear-gradient(135deg, #006491 0%, #004d6f 100%)', logo: 'https://www.google.com/s2/favicons?domain=dominos.com&sz=128' },
    { id: 'zoma-inr', name: 'Zomato Balance', category: 'Food & Delivery', denominations: [500, 1000, 2000], currency: 'INR', bgGradient: 'linear-gradient(135deg, #CB202D 0%, #9c1822 100%)', logo: 'https://www.google.com/s2/favicons?domain=zomato.com&sz=128' },
    
    // Travel
    { id: 'abnb-usd', name: 'Airbnb Gift Card', category: 'Travel', denominations: [100, 200, 500], currency: 'USD', bgGradient: 'linear-gradient(135deg, #FF5A5F 0%, #d43b40 100%)', logo: 'https://www.google.com/s2/favicons?domain=airbnb.com&sz=128' },
    { id: 'hote-usd', name: 'Hotels.com Card', category: 'Travel', denominations: [50, 100, 250, 500], currency: 'USD', bgGradient: 'linear-gradient(135deg, #D41217 0%, #a60e12 100%)', logo: 'https://www.google.com/s2/favicons?domain=hotels.com&sz=128' },
    
    // Virtual Cards
    { id: 'visa-usd', name: 'Visa Virtual Card', category: 'Virtual Cards', denominations: [25, 50, 100, 200, 500], currency: 'USD', bgGradient: 'linear-gradient(135deg, #1a1f71 0%, #0055a5 100%)', logo: 'https://www.google.com/s2/favicons?domain=visa.com&sz=128' },
    { id: 'mast-usd', name: 'Mastercard Virtual', category: 'Virtual Cards', denominations: [25, 50, 100, 200, 500], currency: 'USD', bgGradient: 'linear-gradient(135deg, #f79e1b 0%, #eb001b 100%)', logo: 'https://www.google.com/s2/favicons?domain=mastercard.com&sz=128' },
];

/**
 * GET /api/giftcards
 */
router.get('/', async (req, res, next) => {
    try {
        const { category, search } = req.query;

        // For demo, we primarily use the high-quality fallback data
        let filtered = [...fallbackProducts];

        if (category && category !== 'All') {
            filtered = filtered.filter(p =>
                (p.category || '').toLowerCase() === category.toLowerCase()
            );
        }

        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(p =>
                (p.name || '').toLowerCase().includes(q)
            );
        }

        res.json({
            success: true,
            data: {
                products: filtered,
                total: filtered.length,
                categories
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/giftcards/:productId
 */
router.get('/:productId', async (req, res, next) => {
    try {
        const product = fallbackProducts.find(p => p.id === req.params.productId);

        if (!product) {
            throw new AppError('Gift card not found', 404);
        }

        res.json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
