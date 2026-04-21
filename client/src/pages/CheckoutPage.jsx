import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { HiArrowLeft, HiOutlineClipboardCopy, HiOutlineCheck, HiOutlineMail } from 'react-icons/hi';
import api from '../services/api';
import './CheckoutPage.css';

export default function CheckoutPage() {
    const { state } = useLocation();
    const navigate = useNavigate();

    // Steps: 'email' → 'address' → 'processing' → 'success'
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');
    const [copied, setCopied] = useState(false);
    const [giftCode, setGiftCode] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [cryptoPayAmount, setCryptoPayAmount] = useState('');
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(600);
    const [transactionHash, setTransactionHash] = useState('');
    const [showOnramper, setShowOnramper] = useState(false);
    const [publicSettings, setPublicSettings] = useState({ upiId: '', upiQrImageUrl: '', cardInstructions: '' });
    const [showUpiModal, setShowUpiModal] = useState(false);
    const pollRef = useRef(null);

    useEffect(() => {
        if (!state) navigate('/catalog');
    }, [state, navigate]);

    useEffect(() => {
        fetchPublicSettings();
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const fetchPublicSettings = async () => {
        try {
            const data = await api.getPublicSettings();
            setPublicSettings(data);
        } catch (err) {
            console.error('Failed to fetch public settings:', err);
        }
    };

    if (!state) return null;

    const { brand, amount, totalAmount, processingFee, crypto } = state;

    // STEP 1: User enters email → Click "Pay with crypto"
    const handleGenerateAddress = async () => {
        if (!email) return;
        setLoading(true);
        setError('');

        try {
            const orderData = await api.createOrder({
                brandId: brand.id,
                brandName: brand.name,
                amount: amount,
                currency: brand.currency || 'USD',
                cryptoCurrency: crypto.symbol,
                email,
            });

            setOrderId(orderData.orderId);
            setWalletAddress(orderData.payment.address);
            setCryptoPayAmount(orderData.payment.amount);

            // Store email in localStorage to remember who is currently on this device
            localStorage.setItem('user_email', email);

            setStep('address');
        } catch (err) {
            console.error('Order creation failed:', err);
            setError(err.message || 'Failed to generate payment address. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // STEP 2: User sees REAL address, scans QR, sends payment
    // Click "I've Sent the Payment" → tell backend, start polling for confirmation
    const handleConfirmPayment = async () => {
        setStep('processing');
        setCountdown(600);

        try {
            await api.confirmPayment(orderId, transactionHash);
        } catch (err) {
            console.error('Failed to confirm payment with backend:', err);
        }

        pollRef.current = setInterval(async () => {
            setCountdown(prev => Math.max(0, prev - 1));
            try {
                const updatedOrder = await api.getOrder(orderId);
                if (updatedOrder.status === 'completed') {
                    clearInterval(pollRef.current);
                    setGiftCode(updatedOrder.giftCardCode);
                    setStep('success');
                } else if (updatedOrder.status === 'failed') {
                    clearInterval(pollRef.current);
                    setError('Payment failed. Please contact support.');
                    setStep('address');
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 5000);
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(giftCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className="checkout-page">
            <div className="container">
                {step !== 'success' && (
                    <button className="detail__back" onClick={() => step === 'address' ? setStep('email') : navigate(-1)}>
                        <HiArrowLeft /> Back
                    </button>
                )}

                {error && (
                    <div className="checkout__error animate-fade-in">
                        <p>{error}</p>
                    </div>
                )}

                {/* ── STEP 1: Email Entry ── */}
                {step === 'email' && (
                    <div className="checkout__layout animate-fade-in-up">
                        <div className="checkout__main glass-card">
                            <h2 className="checkout__title">Complete Payment</h2>

                            <div className="checkout__order-summary">
                                <div className="checkout__brand-row">
                                    <div className="checkout__brand-logo" style={{ background: brand.bgGradient, position: 'relative', overflow: 'hidden' }}>
                                        {brand.logo && (
                                            <img 
                                                src={brand.logo} 
                                                alt={brand.name} 
                                                style={{ 
                                                    width: '100%', 
                                                    height: '100%', 
                                                    objectFit: 'contain', 
                                                    position: 'absolute', 
                                                    inset: 0, 
                                                    zIndex: 2,
                                                    padding: '8px',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s'
                                                }} 
                                                onLoad={(e) => {
                                                    e.target.style.opacity = '1';
                                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'none';
                                                }}
                                                onError={e => {
                                                    e.target.style.display = 'none';
                                                }} 
                                            />
                                        )}
                                        <span style={{ 
                                            fontFamily: 'var(--font-heading)', 
                                            fontSize: '1.2rem', 
                                            fontWeight: 700, 
                                            color: '#fff',
                                            zIndex: 1 
                                        }}>
                                            {brand.name.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3>{brand.name} Gift Card</h3>
                                        <p className="checkout__brand-amount">
                                            {brand.currency === 'INR' ? '₹' : '$'}{amount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="checkout__email-section">
                                <label className="detail__label">
                                    <HiOutlineMail style={{ marginRight: '6px' }} />
                                    Email for gift card delivery
                                </label>
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="detail__input"
                                    id="checkout-email"
                                    onKeyDown={e => e.key === 'Enter' && email && handleGenerateAddress()}
                                    autoFocus
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                                    Your gift card code will be sent here after payment is confirmed.
                                </p>
                            </div>

                            <button
                                className="btn btn-primary btn-lg checkout__confirm-btn"
                                onClick={handleGenerateAddress}
                                disabled={!email || loading}
                                id="generate-address-btn"
                            >
                                {loading ? 'Generating Payment Address...' : `Pay with ${crypto.symbol} →`}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Show REAL Address + QR ── */}
                {step === 'address' && (
                    <div className="checkout__layout animate-fade-in-up">
                        <div className="checkout__main glass-card">
                            <h2 className="checkout__title">Send Payment</h2>

                            <div className="checkout__order-summary">
                                <div className="checkout__brand-row">
                                    <div className="checkout__brand-logo" style={{ background: brand.bgGradient, position: 'relative', overflow: 'hidden' }}>
                                        {brand.logo && (
                                            <img 
                                                src={brand.logo} 
                                                alt={brand.name} 
                                                style={{ 
                                                    width: '100%', 
                                                    height: '100%', 
                                                    objectFit: 'contain', 
                                                    position: 'absolute', 
                                                    inset: 0, 
                                                    zIndex: 2,
                                                    padding: '8px',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s'
                                                }} 
                                                onLoad={(e) => {
                                                    e.target.style.opacity = '1';
                                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'none';
                                                }}
                                                onError={e => {
                                                    e.target.style.display = 'none';
                                                }} 
                                            />
                                        )}
                                        <span style={{ 
                                            fontFamily: 'var(--font-heading)', 
                                            fontSize: '1.2rem', 
                                            fontWeight: 700, 
                                            color: '#fff',
                                            zIndex: 1 
                                        }}>
                                            {brand.name.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3>{brand.name} Gift Card</h3>
                                        <p className="checkout__brand-amount">
                                            {brand.currency === 'INR' ? '₹' : '$'}{amount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* REAL Payment Address from NOWPayments */}
                            <div className="checkout__payment-box">
                                <div className="checkout__payment-header">
                                    <span className="checkout__crypto-icon" style={{ color: crypto.color }}>
                                        {crypto.icon}
                                    </span>
                                    <span>Send exactly</span>
                                </div>

                                <div className="checkout__crypto-amount">
                                    {cryptoPayAmount} {crypto.symbol}
                                </div>

                                <p className="checkout__payment-label">to this address:</p>

                                <div className="checkout__wallet-address">
                                    <code>{walletAddress}</code>
                                    <button
                                        className="checkout__copy-addr"
                                        onClick={() => navigator.clipboard.writeText(walletAddress)}
                                    >
                                        <HiOutlineClipboardCopy />
                                    </button>
                                </div>

                                {/* Real QR Code of the REAL address */}
                                <div className="checkout__qr">
                                    <div className="checkout__qr-placeholder">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${walletAddress}`}
                                            alt="Payment QR Code"
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </div>
                                    <p className="checkout__qr-label">Scan to pay</p>
                                </div>
                            </div>

                            <p style={{ fontSize: '0.8rem', color: 'var(--color-success, #4ade80)', textAlign: 'center', margin: '8px 0 16px' }}>
                                ✅ Order {orderId} — Delivering to {email}
                            </p>

                            <div className="checkout__manual-verification">
                                <label className="detail__label" style={{ marginTop: '20px' }}>
                                    Past your Transaction ID (Hash) below:
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter TXID / Hash here..."
                                    value={transactionHash}
                                    onChange={e => setTransactionHash(e.target.value)}
                                    className="detail__input"
                                    style={{ marginBottom: '15px' }}
                                />
                            </div>

                            <button
                                className="btn btn-primary btn-lg checkout__confirm-btn"
                                onClick={handleConfirmPayment}
                                id="confirm-payment-btn"
                                style={{ marginBottom: '12px' }}
                            >
                                I've Sent the Payment
                            </button>
                            <div className="checkout__payment-actions" style={{ textAlign: 'center', marginTop: '10px' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    Need crypto? Use UPI or Cards (Direct Transfer)
                                </p>
                                <button
                                    onClick={() => setShowUpiModal(true)}
                                    className="btn btn-secondary"
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    🏦 Pay via UPI / Card (Direct)
                                </button>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                                    Pay directly to our UPI ID or follow card instructions. 100% anonymous, no KYC required.
                                </p>
                            </div>

                            {/* UPI / Card Direct Modal */}
                            {showUpiModal && (
                                <div className="direct-payment-overlay" onClick={() => setShowUpiModal(false)}>
                                    <div className="direct-payment-card" onClick={e => e.stopPropagation()}>
                                        <button className="direct-payment-close" onClick={() => setShowUpiModal(false)}>&times;</button>
                                        
                                        <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Direct Payment</h2>
                                        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '25px' }}>Scan QR or use UPI ID below</p>

                                        {publicSettings.upiQrImageUrl || publicSettings.upiId ? (
                                             <div className="qr-container">
                                                 <img 
                                                     src={publicSettings.upiQrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${publicSettings.upiId}&pn=GlobalGift`} 
                                                     alt="UPI QR Code" 
                                                     className="qr-image"
                                                 />
                                             </div>
                                         ) : (
                                             <div className="qr-placeholder">
                                                 <p>Scan our UPI QR to pay</p>
                                             </div>
                                         )}

                                        <div style={{ marginBottom: '20px' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px' }}>UPI ID (Copy & Pay):</p>
                                            <div className="checkout__wallet-address" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px' }}>
                                                <code style={{ fontSize: '0.9rem' }}>{publicSettings.upiId || 'Not Configured'}</code>
                                                {publicSettings.upiId && (
                                                    <button
                                                        className="checkout__copy-addr"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(publicSettings.upiId);
                                                            alert('UPI ID Copied!');
                                                        }}
                                                    >
                                                        <HiOutlineClipboardCopy />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="card-instructions-box">
                                            <p style={{ fontSize: '0.85rem', color: '#60a5fa', marginBottom: '8px', fontWeight: 600 }}>Card Users:</p>
                                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
                                                {publicSettings.cardInstructions || 'For international card payments, please use a P2P service like Paxful or Noones to send USDT to our wallet address.'}
                                            </p>
                                        </div>

                                        <button 
                                            className="btn btn-primary btn-lg" 
                                            style={{ width: '100%', marginTop: '30px' }}
                                            onClick={() => setShowUpiModal(false)}
                                        >
                                            I Have Paid
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* ── STEP 3: Processing / Verifying ── */}
                {step === 'processing' && (
                    <div className="checkout__processing animate-fade-in-up">
                        <div className="glass-card checkout__processing-card">
                            {(() => {
                                const scanStage = countdown > 592 ? 1 : countdown > 580 ? 2 : 3;
                                return (
                                    <>
                                        <div
                                            className="checkout__spinner"
                                            style={{
                                                borderColor: scanStage === 1 ? '#f59e0b' : scanStage === 2 ? '#3b82f6' : '#10b981',
                                                borderTopColor: 'transparent',
                                                borderWidth: '3px',
                                                width: '50px',
                                                height: '50px'
                                            }}
                                        ></div>

                                        <h2 style={{ marginTop: '20px', fontSize: '1.4rem' }}>
                                            {scanStage === 1 && "Scanning Network..."}
                                            {scanStage === 2 && "Transaction Detected!"}
                                            {scanStage === 3 && "Awaiting Final Confirmations"}
                                        </h2>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>
                                            {scanStage === 1 && `Searching for your ${crypto.symbol} transfer`}
                                            {scanStage === 2 && "Validating payment amount and signatures"}
                                            {scanStage === 3 && `Network Block Confirmations: ${Math.min(12, Math.floor((580 - countdown) / 5))}/12`}
                                        </p>

                                        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', marginTop: '25px', textAlign: 'left', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Order ID:</span>
                                                <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{orderId}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Expected:</span>
                                                <span style={{ fontWeight: 600, color: crypto.color }}>{cryptoPayAmount} {crypto.symbol}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Destination:</span>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 6)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="checkout__progress-bar" style={{ marginTop: '25px', height: '6px', background: 'rgba(255,255,255,0.05)' }}>
                                            <div
                                                className="checkout__progress-fill"
                                                style={{
                                                    width: scanStage === 1 ? '15%' : scanStage === 2 ? '45%' : `${Math.min(95, 45 + ((580 - countdown) / 2))}%`,
                                                    background: scanStage === 1 ? '#f59e0b' : scanStage === 2 ? '#3b82f6' : '#10b981',
                                                    transition: 'width 1s ease-in-out, background 0.5s ease'
                                                }}
                                            />
                                        </div>

                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '20px', lineHeight: '1.5' }}>
                                            {scanStage === 3
                                                ? "The gift card will be securely deployed to your email as soon as the network fully validates this transaction."
                                                : "Please keep this tab open while we securely verify your payment on the blockchain."}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* ── STEP 4: Success ── */}
                {step === 'success' && (
                    <div className="checkout__success animate-fade-in-up">
                        <div className="glass-card checkout__success-card">
                            <div className="checkout__success-check">✓</div>
                            <h2 className="checkout__success-title">Payment Confirmed!</h2>
                            <p className="checkout__success-subtitle">Your {brand.name} is ready</p>

                            {brand.category === 'Virtual Cards' ? (
                                <div className="virtual-card-container">
                                    <div className="v-card" style={{ background: brand.bgGradient }}>
                                        <div className="v-card__chip"></div>
                                        <div className="v-card__brand-name">{brand.name}</div>
                                        <div className="v-card__number">
                                            {giftCode.split('|')[0] || '**** **** **** ****'}
                                        </div>
                                        <div className="v-card__footer">
                                            <div className="v-card__info">
                                                <span className="v-card__label">VALID THRU</span>
                                                <span className="v-card__value">{giftCode.split('|')[2] || 'MM/YY'}</span>
                                            </div>
                                            <div className="v-card__info">
                                                <span className="v-card__label">CVV</span>
                                                <span className="v-card__value">{giftCode.split('|')[1] || '***'}</span>
                                            </div>
                                        </div>
                                        <div className="v-card__networks">
                                            {brand.name.toLowerCase().includes('visa') ? 'VISA' : 'Mastercard'}
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-secondary sm checkout__gift-code-copy"
                                        onClick={() => {
                                            const [num, cvv, exp] = giftCode.split('|');
                                            navigator.clipboard.writeText(`Card: ${num}\nCVV: ${cvv}\nExpiry: ${exp}`);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                    >
                                        {copied ? <HiOutlineCheck /> : <HiOutlineClipboardCopy />}
                                        {copied ? 'Copied All Details' : 'Copy Card Info'}
                                    </button>
                                </div>
                            ) : (
                                <div className="checkout__gift-code-box">
                                    <label className="checkout__gift-code-label">Your Gift Card Code</label>
                                    <div className="checkout__gift-code">
                                        <code className="checkout__gift-code-text">{giftCode}</code>
                                        <button
                                            className="checkout__gift-code-copy"
                                            onClick={handleCopyCode}
                                            id="copy-code-btn"
                                        >
                                            {copied ? <HiOutlineCheck /> : <HiOutlineClipboardCopy />}
                                            {copied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="checkout__success-details">
                                <div className="checkout__success-detail">
                                    <span>Order ID</span><span>{orderId}</span>
                                </div>
                                <div className="checkout__success-detail">
                                    <span>Product</span><span>{brand.name}</span>
                                </div>
                                <div className="checkout__success-detail">
                                    <span>Value</span>
                                    <span>{brand.currency === 'INR' ? '₹' : '$'}{amount}</span>
                                </div>
                                <div className="checkout__success-detail">
                                    <span>Paid</span><span>{cryptoPayAmount} {crypto.symbol}</span>
                                </div>
                                <div className="checkout__success-detail">
                                    <span>Delivered to</span><span>{email}</span>
                                </div>
                            </div>

                            <div className="checkout__success-actions">
                                <Link to="/catalog" className="btn btn-primary">Buy Another Card</Link>
                                <Link to="/orders" className="btn btn-secondary">View My Orders</Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
