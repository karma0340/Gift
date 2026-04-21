import { Link } from 'react-router-dom';
import { SiBitcoin } from 'react-icons/si';
import { HiOutlineMail } from 'react-icons/hi';
import { FaXTwitter, FaTelegram, FaDiscord } from 'react-icons/fa6';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__top">
                    <div className="footer__brand">
                        <Link to="/" className="footer__logo">
                            <div className="footer__logo-icon">
                                <SiBitcoin />
                            </div>
                            <span className="footer__logo-text">GlobalGift</span>
                        </Link>
                        <p className="footer__desc">
                            Convert cryptocurrency into gift cards for 500+ brands worldwide. Fast, secure, and no KYC required.
                        </p>
                        <div className="footer__socials">
                            <a href="#" className="footer__social" aria-label="Twitter"><FaXTwitter /></a>
                            <a href="#" className="footer__social" aria-label="Telegram"><FaTelegram /></a>
                            <a href="#" className="footer__social" aria-label="Discord"><FaDiscord /></a>
                            <a href="#" className="footer__social" aria-label="Email"><HiOutlineMail /></a>
                        </div>
                    </div>

                    <div className="footer__links-group">
                        <h4 className="footer__links-title">Products</h4>
                        <Link to="/catalog" className="footer__link">Gift Cards</Link>
                        <a href="#how-it-works" className="footer__link">How It Works</a>
                        <Link to="/catalog" className="footer__link">All Brands</Link>
                    </div>

                    <div className="footer__links-group">
                        <h4 className="footer__links-title">Crypto</h4>
                        <span className="footer__link">Bitcoin (BTC)</span>
                        <span className="footer__link">Ethereum (ETH)</span>
                        <span className="footer__link">Tether (USDT)</span>
                        <span className="footer__link">Solana (SOL)</span>
                    </div>

                    <div className="footer__links-group">
                        <h4 className="footer__links-title">Company</h4>
                        <Link to="/privacy" className="footer__link">Privacy Policy</Link>
                        <Link to="/terms" className="footer__link">Terms of Service</Link>
                        <a href="mailto:support@globalgift.app" className="footer__link">Support</a>
                    </div>
                </div>

                <div className="footer__bottom">
                    <p className="footer__copy">
                        © {new Date().getFullYear()} GlobalGift. All rights reserved.
                    </p>
                    <p className="footer__disclaimer">
                        GlobalGift is a demonstration platform for educational and commercial showcase purposes. 
                        All virtual goods and gift cards are fulfilled via secure third-party processors.
                    </p>
                    <p className="footer__disclaimer" style={{ marginTop: '5px', opacity: 0.6 }}>
                        This platform is not affiliated with any of the brands listed. All trademarks belong to their respective owners.
                    </p>
                </div>
            </div>
        </footer>
    );
}
