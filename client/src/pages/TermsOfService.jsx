import React from 'react';
import './Legal.css';

const TermsOfService = () => {
    return (
        <div className="legal-container">
            <div className="container">
                <h1>Terms of Service</h1>
                <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>
                
                <section>
                    <h2>1. Acceptance of Terms</h2>
                    <p>By using this platform, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the site.</p>
                </section>

                <section>
                    <h2>2. Service Description</h2>
                    <p>This platform provides a marketplace for purchasing gift cards using cryptocurrency. All sales are final once the crypto payment is confirmed and the gift card is dispatched.</p>
                </section>

                <section>
                    <h2>3. User Responsibility</h2>
                    <p>Users are responsible for providing the correct email address for gift card delivery and ensuring the correct crypto wallet addresses are used for payments.</p>
                </section>

                <section>
                    <h2>4. Limitation of Liability</h2>
                    <p>We are not liable for any losses resulting from user errors, such as sending funds to the wrong address or providing an incorrect delivery email.</p>
                </section>
            </div>
        </div>
    );
};

export default TermsOfService;
