import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineTag } from 'react-icons/hi';
import brands, { categories } from '../data/GiftCardData';
import './CatalogPage.css';

export default function CatalogPage() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = useMemo(() => {
        return brands.filter(b => {
            const matchCategory = activeCategory === 'All' || b.category === activeCategory;
            const matchSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCategory && matchSearch;
        });
    }, [activeCategory, searchQuery]);

    return (
        <main className="catalog-page">
            <div className="container">
                <div className="catalog__header animate-fade-in-up">
                    <h1 className="catalog__title">Gift Card Catalog</h1>
                    <p className="catalog__subtitle">
                        Browse 500+ brands and pay with your favorite cryptocurrency
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="catalog__controls animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="catalog__search">
                        <HiOutlineSearch className="catalog__search-icon" />
                        <input
                            type="text"
                            placeholder="Search brands..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="catalog__search-input"
                            id="catalog-search"
                        />
                    </div>

                    <div className="catalog__categories">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`catalog__category ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                                id={`category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results count */}
                <p className="catalog__count animate-fade-in" style={{ animationDelay: '0.15s' }}>
                    Showing {filtered.length} {filtered.length === 1 ? 'brand' : 'brands'}
                </p>

                {/* Gift Card Grid */}
                <div className="catalog__grid stagger-children">
                    {filtered.map(brand => (
                        <Link
                            to={`/card/${brand.id}`}
                            className="catalog-card glass-card"
                            key={brand.id}
                            id={`catalog-card-${brand.id}`}
                        >
                            {brand.discount > 0 && (
                                <div className="catalog-card__discount">
                                    <HiOutlineTag /> {brand.discount}% off
                                </div>
                            )}

                            <div
                                className="catalog-card__logo"
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
                                            padding: '6px',
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
                                    className="catalog-card__initial"
                                    style={{
                                        color: brand.color === '#1b2838' || brand.color === '#000000' ? '#fff' : brand.color,
                                        zIndex: 1,
                                        background: brand.bgGradient,
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '8px'
                                    }}
                                >
                                    {brand.name.charAt(0)}
                                </span>
                            </div>

                            <div className="catalog-card__content">
                                <h3 className="catalog-card__name">{brand.name}</h3>

                                <p className="catalog-card__category-tag">
                                    {brand.category}
                                </p>

                                <p className="catalog-card__desc">{brand.description}</p>

                                <div className="catalog-card__amounts">
                                    {brand.denominations.slice(0, 4).map(d => (
                                        <span key={d} className="catalog-card__amount">
                                            {brand.currency === 'INR' ? '₹' : '$'}{d}
                                        </span>
                                    ))}
                                    {brand.denominations.length > 4 && (
                                        <span className="catalog-card__amount">+{brand.denominations.length - 4}</span>
                                    )}
                                </div>

                                <div className="catalog-card__footer">
                                    <span className="catalog-card__buy-btn">Buy Now →</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="catalog__empty">
                        <p>No gift cards found. Try a different search or category.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
