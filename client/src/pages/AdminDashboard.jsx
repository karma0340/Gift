import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, DollarSign, Package, CheckCircle, RefreshCcw, Settings, Wallet, Save, Eye, EyeOff, Check, Copy } from 'lucide-react';
import api from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('orders');
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    // Fulfill Modal State
    const [fulfillModal, setFulfillModal] = useState({ show: false, order: null });
    const [cardNum, setCardNum] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardExp, setCardExp] = useState('');
    const [giftCardCode, setGiftCardCode] = useState('');
    const [giftCardPin, setGiftCardPin] = useState('');
    const [fulfilling, setFulfilling] = useState(false);

    // Wallet Settings State
    const [wallets, setWallets] = useState([]);
    const [fiatSettlementCurrency, setFiatSettlementCurrency] = useState('usdttrc20');
    const [walletLoading, setWalletLoading] = useState(false);
    const [walletSaving, setWalletSaving] = useState(false);
    const [walletSuccess, setWalletSuccess] = useState(false);
    const [walletError, setWalletError] = useState('');
    const [visibleAddresses, setVisibleAddresses] = useState({});
    
    // Direct Payment Settings
    const [upiId, setUpiId] = useState('');
    const [upiQrImageUrl, setUpiQrImageUrl] = useState('');
    const [cardInstructions, setCardInstructions] = useState('');

    const navigate = useNavigate();
    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        if (!token) {
            navigate('/secure-admin-portal/login');
            return;
        }
        fetchData();
    }, [filter, token, navigate]);

    useEffect(() => {
        if (activeTab === 'settings' && wallets.length === 0) {
            fetchWalletSettings();
        }
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const statsData = await api.getAdminStats(token);
            setStats(statsData);
            const ordersData = await api.getAdminOrders(token, 1, 50, filter);
            setOrders(ordersData.orders);
        } catch (err) {
            if (err.message.includes('token') || err.message.includes('401')) {
                localStorage.removeItem('adminToken');
                navigate('/secure-admin-portal/login');
            } else {
                setError('Failed to fetch dashboard data. ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchWalletSettings = async () => {
        setWalletLoading(true);
        setWalletError('');
        try {
            const settings = await api.getAdminSettings(token);
            setWallets(settings.walletAddresses || []);
            if (settings.fiatSettlementCurrency) {
                setFiatSettlementCurrency(settings.fiatSettlementCurrency);
            }
            if (settings.upiId) setUpiId(settings.upiId);
            if (settings.upiQrImageUrl) setUpiQrImageUrl(settings.upiQrImageUrl);
            if (settings.cardInstructions) setCardInstructions(settings.cardInstructions);
        } catch (err) {
            setWalletError('Failed to load wallet settings: ' + err.message);
        } finally {
            setWalletLoading(false);
        }
    };

    const handleWalletChange = (index, field, value) => {
        setWallets(prev => prev.map((w, i) => i === index ? { ...w, [field]: value } : w));
    };

    const saveWalletSettings = async () => {
        setWalletSaving(true);
        setWalletError('');
        setWalletSuccess(false);
        try {
            await api.updateAdminWallets(token, wallets, fiatSettlementCurrency, upiId, upiQrImageUrl, cardInstructions);
            setWalletSuccess(true);
            setTimeout(() => setWalletSuccess(false), 3000);
        } catch (err) {
            setWalletError('Failed to save: ' + err.message);
        } finally {
            setWalletSaving(false);
        }
    };

    const toggleAddressVisibility = (index) => {
        setVisibleAddresses(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/secure-admin-portal/login');
    };

    const openFulfillModal = (order) => {
        setFulfillModal({ show: true, order });
        setCardNum(''); setCardCvv(''); setCardExp('');
        setGiftCardCode(''); setGiftCardPin('');
    };

    const submitFulfill = async (e) => {
        e.preventDefault();
        setFulfilling(true);
        try {
            const finalCode = fulfillModal.order?.brand.category === 'Virtual Cards'
                ? `${cardNum}|${cardCvv}|${cardExp}`
                : giftCardCode;
            await api.fulfillAdminOrder(token, fulfillModal.order.orderId, finalCode, giftCardPin);
            setFulfillModal({ show: false, order: null });
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to fulfill order');
        } finally {
            setFulfilling(false);
        }
    };

    if (loading && !stats) return <div className="admin-loading">Loading Dashboard...</div>;

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <header className="admin-header">
                <div className="admin-header-left">
                    <h1>GlobalGift Admin</h1>
                    <span className="badge">Production</span>
                </div>
                <div className="admin-header-right">
                    <button onClick={fetchData} className="btn-icon" title="Refresh">
                        <RefreshCcw size={20} />
                    </button>
                    <button onClick={handleLogout} className="btn btn-secondary logout-btn">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </header>

            {/* Tab Navigation */}
            <nav className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    <Package size={16} /> Orders
                </button>
                <button
                    className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <Wallet size={16} /> Wallet Settings
                </button>
            </nav>

            <main className="admin-main">
                {error && <div className="admin-error-message">{error}</div>}

                {/* ===== ORDERS TAB ===== */}
                {activeTab === 'orders' && (
                    <>
                        {/* Stats Cards */}
                        {stats && (
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon revenue"><DollarSign size={24} /></div>
                                    <div className="stat-details">
                                        <h3>Total Revenue</h3>
                                        <p className="stat-value">${stats.revenue.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon pending"><Package size={24} /></div>
                                    <div className="stat-details">
                                        <h3>Pending Orders</h3>
                                        <p className="stat-value">{stats.pendingOrders}</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon completed"><CheckCircle size={24} /></div>
                                    <div className="stat-details">
                                        <h3>Completed Orders</h3>
                                        <p className="stat-value">{stats.completedOrders}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Orders Section */}
                        <div className="admin-section">
                            <div className="section-header">
                                <h2>Recent Orders</h2>
                                <div className="filter-group">
                                    <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
                                    <button className={filter === 'payment_received' ? 'active' : ''} onClick={() => setFilter('payment_received')}>Pending Fulfill</button>
                                    <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Completed</button>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Date</th>
                                            <th>Customer</th>
                                            <th>Gift Card</th>
                                            <th>Crypto Paid</th>
                                            <th>TX / Ref / Code</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading && orders.length === 0 ? (
                                            <tr><td colSpan="7" className="text-center">Loading orders...</td></tr>
                                        ) : orders.length === 0 ? (
                                            <tr><td colSpan="7" className="text-center">No orders found.</td></tr>
                                        ) : (
                                            orders.map(order => (
                                                <tr key={order._id}>
                                                    <td className="mono">{order.orderId}</td>
                                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                                    <td>{order.email}</td>
                                                    <td>{order.brand?.name || 'Unknown'} <strong>${order.amount}</strong></td>
                                                    <td className="mono">{order.crypto?.amount} {order.crypto?.currency?.toUpperCase()}</td>
                                                    <td className="mono" style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {order.crypto?.transactionHash ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                <span title={order.crypto?.transactionHash}>
                                                                    {order.crypto?.transactionHash?.length > 20 ? `${order.crypto.transactionHash.substring(0, 10)}...` : order.crypto?.transactionHash}
                                                                </span>
                                                                <button 
                                                                    className="btn-icon" 
                                                                    style={{ padding: '2px', background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer' }}
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(order.crypto?.transactionHash || '');
                                                                        alert('Copied to clipboard!');
                                                                    }}
                                                                    title="Copy to Clipboard"
                                                                >
                                                                    <Copy size={12} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>No Ref</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge status-${order.status}`}>
                                                            {order.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {order.status !== 'completed' && order.status !== 'failed' ? (
                                                            <button className="btn btn-primary sm" onClick={() => openFulfillModal(order)}>
                                                                Fulfill Now
                                                            </button>
                                                        ) : (
                                                            <button className="btn btn-secondary sm disabled" disabled>Done</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ===== WALLET SETTINGS TAB ===== */}
                {activeTab === 'settings' && (
                    <div className="admin-section settings-section">
                        <div className="section-header">
                            <h2><Wallet size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />Payout Wallet Addresses</h2>
                            <p className="section-subtitle">Set the wallet address for each cryptocurrency. Customers will send payments to these addresses.</p>
                        </div>

                        {walletLoading ? (
                            <div className="wallet-loading">Loading wallet settings...</div>
                        ) : (
                            <>
                                {walletError && <div className="admin-error-message">{walletError}</div>}



                                <div className="wallets-grid">
                                    {wallets.map((wallet, index) => (
                                        <div key={wallet.currency} className={`wallet-card ${!wallet.enabled ? 'wallet-disabled' : ''}`}>
                                            <div className="wallet-card-header">
                                                <div className="wallet-info">
                                                    <span className="wallet-currency-badge">{wallet.network}</span>
                                                    <span className="wallet-label">{wallet.label}</span>
                                                </div>
                                                <label className="toggle-switch" title={wallet.enabled ? 'Enabled' : 'Disabled'}>
                                                    <input
                                                        type="checkbox"
                                                        checked={wallet.enabled}
                                                        onChange={(e) => handleWalletChange(index, 'enabled', e.target.checked)}
                                                    />
                                                    <span className="toggle-slider"></span>
                                                </label>
                                            </div>

                                            <div className="wallet-address-group">
                                                <label>Wallet Address</label>
                                                <div className="address-input-wrap">
                                                    <input
                                                        type={visibleAddresses[index] ? 'text' : 'password'}
                                                        placeholder={`Enter your ${wallet.label} address...`}
                                                        value={wallet.address}
                                                        onChange={(e) => handleWalletChange(index, 'address', e.target.value)}
                                                        className="wallet-address-input"
                                                        disabled={!wallet.enabled}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="toggle-visibility-btn"
                                                        onClick={() => toggleAddressVisibility(index)}
                                                        title={visibleAddresses[index] ? 'Hide' : 'Show'}
                                                    >
                                                        {visibleAddresses[index] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                                {wallet.address && (
                                                    <span className="address-preview">
                                                        {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="direct-payment-settings" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #333' }}>
                                    <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Package size={20} className="accent-color" /> Direct Payments (UPI & Cards)
                                    </h3>
                                    
                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Personal UPI ID (VPA)</label>
                                        <input 
                                            className="admin-input" 
                                            placeholder="e.g. success@upi" 
                                            value={upiId} 
                                            onChange={(e) => setUpiId(e.target.value)} 
                                        />
                                    </div>
                                    
                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>UPI QR Code Image URL</label>
                                        <input 
                                            className="admin-input" 
                                            placeholder="https://example.com/my-qr.png" 
                                            value={upiQrImageUrl} 
                                            onChange={(e) => setUpiQrImageUrl(e.target.value)} 
                                        />
                                    </div>
                                    
                                </div>

                                <div className="settings-actions">
                                    {walletSuccess && (
                                        <div className="success-banner">
                                            <Check size={18} /> Wallet addresses saved successfully!
                                        </div>
                                    )}
                                    <button
                                        className="btn btn-primary save-btn"
                                        onClick={saveWalletSettings}
                                        disabled={walletSaving}
                                    >
                                        {walletSaving ? (
                                            <><RefreshCcw size={16} className="spin" /> Saving...</>
                                        ) : (
                                            <><Save size={16} /> Save Wallet Addresses</>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>

            {/* Fulfill Modal */}
            {fulfillModal.show && (
                <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' }}>
                    <div className="modal-content admin-modal" style={{ background: '#121212', padding: '30px', borderRadius: '15px', maxWidth: '500px', width: '90%', border: '1px solid #333' }}>
                        <h2>Fulfill Order {fulfillModal.order?.orderId}</h2>
                        <p className="modal-subtitle">Purchased: {fulfillModal.order?.brand.name} for ${fulfillModal.order?.amount}</p>

                        <div className="fulfillment-instructions" style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '20px' }}>
                            1. Confirm receipt of <strong>{fulfillModal.order?.crypto.amount} {fulfillModal.order?.crypto.currency.toUpperCase()}</strong>.<br />
                            2. Purchase the gift card manually.<br />
                            3. Enter the code below to email the customer.
                        </div>

                        <form onSubmit={submitFulfill}>
                            {fulfillModal.order?.brand.category === 'Virtual Cards' ? (
                                <>
                                    <div className="form-group">
                                        <label>16-Digit Card Number</label>
                                        <input className="admin-input" type="text" required placeholder="4111 2222 3333 4444" value={cardNum} onChange={(e) => setCardNum(e.target.value)} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label>CVV</label>
                                            <input className="admin-input" type="text" required placeholder="123" maxLength="4" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label>Expiry (MM/YY)</label>
                                            <input className="admin-input" type="text" required placeholder="12/26" value={cardExp} onChange={(e) => setCardExp(e.target.value)} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Gift Card Code (Required)</label>
                                        <input className="admin-input" type="text" required placeholder="e.g. AQBW-Y7XY..." value={giftCardCode} onChange={(e) => setGiftCardCode(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Gift Card PIN (Optional)</label>
                                        <input className="admin-input" type="text" placeholder="Leave blank if none" value={giftCardPin} onChange={(e) => setGiftCardPin(e.target.value)} />
                                    </div>
                                </>
                            )}

                            <div className="modal-actions" style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setFulfillModal({ show: false, order: null })}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={fulfilling}>
                                    {fulfilling ? 'Sending...' : 'Fulfill now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
