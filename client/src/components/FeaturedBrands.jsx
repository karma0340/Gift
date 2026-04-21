import { Link } from 'react-router-dom';
import brands from '../data/GiftCardData';
import './FeaturedBrands.css';

export default function FeaturedBrands() {
    const featured = brands.filter(b => b.popular);

    return (
        <section className="featured section">
            <div className="container">
                <h2 className="section-title">Popular Gift Cards</h2>
                <p className="section-subtitle">
                    Our most-requested brands, available instantly with crypto payment
                </p>

                <div className="featured__grid stagger-children">
                    {featured.map(brand => (
                        <Link
                            to={`/card/${brand.id}`}
                            className="featured__card glass-card"
                            key={brand.id}
                            id={`featured-${brand.id}`}
                        >
                            <div
                                className="featured__card-logo"
                                style={{ position: 'relative', overflow: 'hidden' }}
                            >
                                {brand.logo && (
                                    <img 
                                        src={brand.logo} 
                                        alt={brand.name} 
                                        loading="lazy"
                                        style={{ 
                                            width: '100%', 
                                            height: '100%', 
                                            objectFit: 'contain', 
                                            position: 'absolute', 
                                            inset: 0, 
                                            zIndex: 2,
                                            padding: '4px',
                                            transition: 'opacity 0.2s ease-in-out'
                                        }}
                                        onLoad={(e) => {
                                            e.target.style.opacity = '1';
                                            e.target.parentElement.style.background = 'transparent';
                                            e.target.parentElement.style.boxShadow = 'none';
                                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'none';
                                        }}
                                        onError={(e) => { 
                                            e.target.style.display = 'none';
                                            if (e.target.nextSibling) {
                                                e.target.nextSibling.style.opacity = '1';
                                                e.target.nextSibling.style.display = 'flex';
                                            }
                                        }}
                                    />
                                )}
                                <span 
                                    className="featured__card-initial" 
                                    style={{ 
                                        color: brand.color === '#1b2838' || brand.color === '#000000' ? '#fff' : brand.color,
                                        zIndex: 1,
                                        background: brand.bgGradient,
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '12px'
                                    }}
                                >
                                    {brand.name.charAt(0)}
                                </span>
                            </div>
                            <div className="featured__card-info">
                                <h3 className="featured__card-name">{brand.name}</h3>
                                <p className="featured__card-category">{brand.category}</p>
                            </div>
                            {brand.discount > 0 && (
                                <span className="badge badge-green featured__card-discount">
                                    -{brand.discount}%
                                </span>
                            )}
                        </Link>
                    ))}
                </div>

                <div className="featured__cta">
                    <Link to="/catalog" className="btn btn-secondary btn-lg">
                        View All 500+ Brands →
                    </Link>
                </div>
            </div>
        </section>
    );
}
