import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Boutique.css';

export default function Boutique() {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [items, setItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCart, setShowCart] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [user, setUser] = useState(null);

    useEffect(() => {
        checkAuth();
        loadCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            loadItems(selectedCategory);
        }
    }, [selectedCategory]);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/me', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.loggedIn) {
                    setUser(data.user);
                }
            }
        } catch (err) {
            console.error('Erreur auth:', err);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await fetch('/api/shop/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
                if (data.length > 0) {
                    setSelectedCategory(data[0].id);
                } else {
                    setItems([]);
                    setLoading(false);
                }
            } else {
                console.error('Erreur chargement catégories:', res.statusText || res.status);
                setLoading(false);
            }
        } catch (err) {
            console.error('Erreur chargement catégories:', err);
            setLoading(false);
        }
    };

    const loadItems = async (categoryId) => {
        if (!categoryId) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/shop/items/category/${categoryId}`);
            if (res.ok) {
                setItems(await res.json());
            } else {
                console.error('Erreur chargement items:', res.statusText || res.status);
                setItems([]);
            }
        } catch (err) {
            console.error('Erreur chargement items:', err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (item) => {
        const existingItem = cart.find(i => i.id === item.id);
        if (existingItem) {
            setCart(cart.map(i => 
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
    };

    const removeFromCart = (itemId) => {
        setCart(cart.filter(i => i.id !== itemId));
    };

    const updateQuantity = (itemId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(itemId);
        } else {
            setCart(cart.map(i => 
                i.id === itemId ? { ...i, quantity } : i
            ));
        }
    };

    const validatePromo = async () => {
        if (!promoCode) return;

        try {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const res = await fetch('/api/shop/promo/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code: promoCode, totalPrice: total })
            });

            if (res.ok) {
                const data = await res.json();
                setPromoDiscount(data.discount);
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (err) {
            console.error('Erreur validation promo:', err);
        }
    };

    const getTotalPrice = () => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return subtotal - promoDiscount;
    };

    const handleCheckout = async () => {
        if (!user) {
            alert('Vous devez être connecté pour commander');
            return;
        }

        if (cart.length === 0) {
            alert('Votre panier est vide');
            return;
        }

        // Rediriger vers la page de paiement avec les données du panier
        navigate('/paiement', {
            state: {
                cart: cart,
                promoCode: promoCode,
                promoDiscount: promoDiscount,
                totalPrice: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            }
        });
    };

    return (
        <div className="boutique-container">
            {/* Header */}
            <div className="boutique-header">
                <div className="header-content">
                    <h1>Boutique du Serveur</h1>
                    <p>Achetez des items exclusifs pour votre expérience de jeu</p>
                </div>
                <button 
                    className="cart-btn"
                    onClick={() => setShowCart(!showCart)}
                >
                    🛒 Panier ({cart.length})
                </button>
            </div>

            <div className="boutique-content">
                {/* Catégories */}
                <div className="categories-sidebar">
                    <h3>Catégories</h3>
                    {categories.map(cat => (
                        <button 
                            key={cat.id}
                            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.icon && <span className="cat-icon">{cat.icon}</span>}
                            {cat.name}
                            <span className="item-count">({cat.item_count})</span>
                        </button>
                    ))}
                </div>

                {/* Items ou Panier */}
                <div className="main-content">
                    {!showCart ? (
                        <div className="items-grid">
                            {loading ? (
                                <p>Chargement...</p>
                            ) : items.length === 0 ? (
                                <p>Aucun item disponible</p>
                            ) : (
                                items.map(item => (
                                    <div key={item.id} className="item-card">
                                        {item.image_url && (
                                            <img src={item.image_url} alt={item.name} className="item-image" />
                                        )}
                                        <div className="item-info">
                                            <h4>{item.name}</h4>
                                            <p className="item-desc">{item.description}</p>
                                            <div className="item-footer">
                                                <span className="price">{item.price}€</span>
                                                <button 
                                                    className="add-btn"
                                                    onClick={() => addToCart(item)}
                                                >
                                                    Ajouter
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="cart-panel">
                            <h2>Votre Panier</h2>
                            {cart.length === 0 ? (
                                <p className="empty-cart">Panier vide</p>
                            ) : (
                                <>
                                    <div className="cart-items">
                                        {cart.map(item => (
                                            <div key={item.id} className="cart-item">
                                                <div className="cart-item-info">
                                                    <h5>{item.name}</h5>
                                                    <p>{item.price}€ x {item.quantity}</p>
                                                </div>
                                                <div className="cart-item-controls">
                                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                                    <span>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                                </div>
                                                <button 
                                                    className="remove-btn"
                                                    onClick={() => removeFromCart(item.id)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Code Promo */}
                                    <div className="promo-section">
                                        <input 
                                            type="text"
                                            placeholder="Code promo"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                        />
                                        <button onClick={validatePromo}>Appliquer</button>
                                    </div>

                                    {/* Résumé */}
                                    <div className="cart-summary">
                                        <div className="summary-line">
                                            <span>Sous-total</span>
                                            <span>{(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)).toFixed(2)}€</span>
                                        </div>
                                        {promoDiscount > 0 && (
                                            <div className="summary-line discount">
                                                <span>Réduction</span>
                                                <span>-{promoDiscount.toFixed(2)}€</span>
                                            </div>
                                        )}
                                        <div className="summary-line total">
                                            <span>Total</span>
                                            <span>{getTotalPrice().toFixed(2)}€</span>
                                        </div>
                                    </div>

                                    <button className="checkout-btn" onClick={handleCheckout}>
                                        Procéder au paiement
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
