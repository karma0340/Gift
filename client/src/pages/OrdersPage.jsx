import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineClipboardCopy, HiOutlineCheck, HiOutlineRefresh } from 'react-icons/hi';
import api from '../services/api';
import brands from '../data/GiftCardData';
import './OrdersPage.css';

// Brand style map for display
const brandStyles = {
    amazon: { color: '#FF9900', bg: 'linear-gradient(135deg, #232f3e 0%, #131921 100%)' },
    flipkart: { color: '#2874F0', bg: 'linear-gradient(135deg, #2874F0 0%, #1a5cc7 100%)' },
    ebay: { color: '#E53238', bg: 'linear-gradient(135deg, #E53238 0%, #b22228 100%)' },
    steam: { color: '#fff', bg: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)' },
    playstation: { color: '#fff', bg: 'linear-gradient(135deg, #003087 0%, #00246d 100%)' },
    xbox: { color: '#fff', bg: 'linear-gradient(135deg, #107C10 0%, #0c5e0c 100%)' },
    netflix: { color: '#fff', bg: 'linear-gradient(135deg, #E50914 0%, #b00710 100%)' },
    spotify: { color: '#fff', bg: 'linear-gradient(135deg, #1DB954 0%, #169c46 100%)' },
    apple: { color: '#A3AAAE', bg: 'linear-gradient(135deg, #333333 0%, #1a1a1a 100%)' },
    'google-play': { color: '#34A853', bg: 'linear-gradient(135deg, #4285F4 0%, #34A853 50%, #FBBC05 100%)' },
    uber: { color: '#fff', bg: 'linear-gradient(135deg, #276EF1 0%, #1a56c4 100%)' },
    doordash: { color: '#fff', bg: 'linear-gradient(135deg, #FF3008 0%, #d42806 100%)' },
};

const defaultStyle = { color: '#fff', bg: 'linear-gradient(135deg, #444 0%, #222 100%)' };

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const storedEmail = localStorage.getItem('user_email');
            
            if (!storedEmail) {
                setOrders([]);
                setLoading(false);
                return;
            }

            const data = await api.getOrders(storedEmail);
            setOrders(data.orders || []);
        } catch (err) {
            console.warn('Failed to fetch orders from backend, using empty list');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCopy = (code, orderId) => {
        navigator.clipboard.writeText(code);
        setCopiedId(orderId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return 'badge badge-green';
            case 'processing':
            case 'payment_received': return 'badge badge-cyan';
            case 'pending': return 'badge badge-orange';
            case 'failed':
            case 'refunded': return 'badge badge-purple';
            default: return 'badge';
        }
    };

    return (
        <main className="orders-page">
            <div className="container">
                <div className="orders__header animate-fade-in-up">
                    <h1 className="orders__title">My Orders</h1>
                    <p className="orders__subtitle">
                        Your gift card purchase history and codes
                    </p>
                    <button className="btn btn-secondary btn-sm" onClick={fetchOrders} style={{ marginTop: '16px' }}>
                        <HiOutlineRefresh /> Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="orders__loading">
                        <div className="checkout__spinner"></div>
                        <p>Loading orders...</p>
                    </div>
                ) : orders.length > 0 ? (
                    <div className="orders__list stagger-children">
                        {orders.map(order => {
                            const style = brandStyles[order.brand?.id] || defaultStyle;
                            return (
                                <div className="orders__item glass-card" key={order.orderId}>
                                    <div className="orders__item-left">
                                        <div
                                            className="orders__item-logo"
                                            style={{ position: 'relative', overflow: 'hidden' }}
                                        >
                                            {order.brand?.id && brands.find(b => b.id === order.brand.id)?.logo && (
                                                <img 
                                                    src={brands.find(b => b.id === order.brand.id).logo} 
                                                    alt="" 
                                                    style={{ 
                                                        width: '100%', 
                                                        height: '100%', 
                                                        objectFit: 'contain', 
                                                        position: 'absolute', 
                                                        inset: 0, 
                                                        zIndex: 2,
                                                        transition: 'opacity 0.2s ease-in-out'
                                                    }} 
                                                    onLoad={(e) => {
                                                        e.target.style.opacity = '1';
                                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'none';
                                                    }}
                                                    onError={e => {
                                                        e.target.style.display = 'none';
                                                        if (e.target.nextSibling) {
                                                            e.target.nextSibling.style.display = 'flex';
                                                            e.target.nextSibling.style.opacity = '1';
                                                        }
                                                    }} 
                                                />
                                            )}
                                            <span style={{
                                                fontFamily: 'var(--font-heading)',
                                                fontSize: '1rem',
                                                fontWeight: 700,
                                                color: style.color,
                                                background: style.bg,
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '8px',
                                                zIndex: 1
                                            }}>
                                                {(order.brand?.name || '?').charAt(0)}
                                            </span>
                                        </div>

                                        <div className="orders__item-info">
                                            <h3 className="orders__item-brand">{order.brand?.name || 'Unknown'} Gift Card</h3>
                                            <p className="orders__item-id">{order.orderId}</p>
                                            <p className="orders__item-date">
                                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="orders__item-center">
                                        {order.giftCardCode ? (
                                            <div className="orders__item-code-section">
                                                <span className="orders__item-code-label">Gift Card Code</span>
                                                <div className="orders__item-code">
                                                    <code>{order.giftCardCode}</code>
                                                    <button
                                                        className="orders__copy-btn"
                                                        onClick={() => handleCopy(order.giftCardCode, order.orderId)}
                                                    >
                                                        {copiedId === order.orderId ? <HiOutlineCheck /> : <HiOutlineClipboardCopy />}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                {order.status === 'pending' ? 'Awaiting payment...' :
                                                    order.status === 'processing' ? 'Generating gift card...' :
                                                        'Code not available'}
                                            </p>
                                        )}
                                    </div>

                                    <div className="orders__item-right">
                                        <div className="orders__item-amount">
                                            {order.currency === 'INR' ? '₹' : '$'}{order.amount}
                                        </div>
                                        <div className="orders__item-crypto">
                                            {order.crypto?.amount} {order.crypto?.currency}
                                        </div>
                                        <span className={getStatusBadge(order.status)}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="orders__empty glass-card">
                        <h3>{localStorage.getItem('user_email') ? 'No orders yet' : 'No history found on this device'}</h3>
                        <p>
                            {localStorage.getItem('user_email') 
                                ? 'Start shopping by browsing our gift card catalog'
                                : 'To view your order history, please first complete a purchase on this device.'}
                        </p>
                        <Link to="/catalog" className="btn btn-primary" style={{ marginTop: '16px' }}>
                            Browse Gift Cards
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
