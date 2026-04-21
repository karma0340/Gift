const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Order = require('../models/Order');
const Settings = require('../models/Settings');

async function resetDatabase() {
    try {
        console.log('🔌 Connecting to database for reset...');
        
        if (!process.env.MONGODB_URI) {
            console.error('❌ Error: MONGODB_URI not found in .env file.');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        // 1. Delete all orders
        console.log('🗑️ Deleting all orders...');
        const orderResult = await Order.deleteMany({});
        console.log(`✅ Deleted ${orderResult.deletedCount} orders.`);

        // 2. Reset settings to generic defaults
        console.log('🛠️ Resetting settings to defaults (removing your wallet addresses)...');
        await Settings.deleteMany({});
        const defaultSettings = await Settings.create({
            singleton: 'global',
            walletAddresses: [
                { currency: 'btc',       label: 'Bitcoin',           network: 'BTC',   address: '', enabled: true },
                { currency: 'eth',       label: 'Ethereum',          network: 'ERC20', address: '', enabled: true },
                { currency: 'usdttrc20', label: 'USDT (TRC20)',      network: 'TRC20', address: '', enabled: true },
                { currency: 'usdterc20', label: 'USDT (ERC20)',      network: 'ERC20', address: '', enabled: false },
                { currency: 'sol',       label: 'Solana',            network: 'SOL',   address: '', enabled: true },
                { currency: 'bnb',       label: 'BNB (BSC)',         network: 'BEP20', address: '', enabled: true },
            ],
            fiatSettlementCurrency: 'usdttrc20'
        });
        console.log('✅ Settings reset to generic state.');

        console.log('\n✨ DATABASE SUCCESSFULLY ANONYMIZED! ✨');
        console.log('Your personal wallet addresses and order history are now GONE from the cloud.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Reset failed:', error.message);
        process.exit(1);
    }
}

resetDatabase();
