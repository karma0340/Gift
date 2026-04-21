import React from 'react';
import './Legal.css';

const PrivacyPolicy = () => {
    return (
        <div className="legal-container">
            <div className="container">
                <h1>Privacy Policy</h1>
                <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>
                
                <section>
                    <h2>1. Information We Collect</h2>
                    <p>We only collect the necessary information to process your gift card orders, such as your email address for delivery and crypto transaction data.</p>
                </section>

                <section>
                    <h2>2. How We Use Data</h2>
                    <p>Your data is used solely for the fulfillment of gift card orders and to provide support. We do not sell or share your personal information with third parties for marketing purposes.</p>
                </section>

                <section>
                    <h2>3. Security</h2>
                    <p>We implement industry-standard security measures, including HTTPS encryption and secure database storage, to protect your data from unauthorized access.</p>
                </section>

                <section>
                    <h2>4. Project Nature</h2>
                    <p>This platform serves as a demonstration of a gift card marketplace. Users should ensure they are using the correct wallet addresses for all transactions.</p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
