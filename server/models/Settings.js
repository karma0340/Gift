const mongoose = require('mongoose');

const walletAddressSchema = new mongoose.Schema({
    currency: { type: String, required: true }, // e.g. 'btc', 'eth', 'usdttrc20'
    label: { type: String, required: true },    // e.g. 'Bitcoin', 'Ethereum'
    address: { type: String, default: '' },     // The wallet address
    network: { type: String, default: '' },     // e.g. 'TRC20', 'ERC20'
    enabled: { type: Boolean, default: true },
});

const settingsSchema = new mongoose.Schema({
    // Singleton pattern — only one settings doc
    singleton: { type: String, default: 'global', unique: true },

    walletAddresses: {
        type: [walletAddressSchema],
        default: [
            { currency: 'btc',       label: 'Bitcoin',           network: 'BTC',   address: '', enabled: true },
            { currency: 'eth',       label: 'Ethereum',          network: 'ERC20', address: '', enabled: true },
            { currency: 'usdttrc20', label: 'USDT (TRC20)',      network: 'TRC20', address: '', enabled: true },
            { currency: 'usdterc20', label: 'USDT (ERC20)',      network: 'ERC20', address: '', enabled: false },
            { currency: 'sol',       label: 'Solana',            network: 'SOL',   address: '', enabled: true },
            { currency: 'bnb',       label: 'BNB (BSC)',         network: 'BEP20', address: '', enabled: true },
            { currency: 'ltc',       label: 'Litecoin',          network: 'LTC',   address: '', enabled: false },
        ]
    },

    fiatSettlementCurrency: { type: String, default: 'usdttrc20' },

    // Direct Payment Settings (No KYC, No Sign-up)
    upiId: { type: String, default: '' },
    upiQrImageUrl: { type: String, default: '' },
    cardInstructions: { type: String, default: 'For international card payments, please use a P2P service like Paxful or Noones to send USDT to our wallet address.' },

    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Static method: get or create the singleton settings document
settingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne({ singleton: 'global' });
    if (!settings) {
        settings = await this.create({ singleton: 'global' });
    }
    return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
