import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Boutique.css';

export default function Boutique() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [items, setItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCart, setShowCart] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [user, setUser] = useState(null);

    const [cartLoaded, setCartLoaded] = useState(false);

    // 🔥 LOAD CART (fix anti reset)
    useEffect(() => {
        try {
            const saved = localStorage.getItem('cart');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) setCart(parsed);
            }
        } catch (e) {
            console.error(e);
            localStorage.removeItem('cart');
        } finally {
            setCartLoaded(true);
        }
    }, []);

    // 🔥 SAVE CART
    useEffect(() => {
        if (!cartLoaded) return;
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart, cartLoaded]);

    useEffect(() => {
        checkAuth();
        loadCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) loadItems(selectedCategory);
    }, [selectedCategory]);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/me', { credentials: 'include' });
            const data = await res.json();
            if (data.loggedIn) setUser(data.user);
        } catch (err) {
            console.error(err);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await fetch('/api/shop/categories');
            const data = await res.json();

            setCategories(data);

            if (data.length > 0) setSelectedCategory(data[0].id);

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const loadItems = async (categoryId) => {
        setLoading(true);

        try {
            const res = await fetch(`/api/shop/items/category/${categoryId}`);
            const data = await res.json();
            setItems(data);
        } catch (err) {
            console.error(err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (item) => {
        const exist = cart.find(i => i.id === item.id);

        if (exist) {
            setCart(cart.map(i =>
                i.id === item.id
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
            ));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(i => i.id !== id));
    };

    const updateQuantity = (id, qty) => {
        if (qty <= 0) return removeFromCart(id);

        setCart(cart.map(i =>
            i.id === id ? { ...i, quantity: qty } : i
        ));
    };

    const getSubtotal = () =>
        cart.reduce((s, i) => s + i.price * i.quantity, 0);

    const getTotal = () => getSubtotal() - promoDiscount;
        const handleApplyPromo = async () => {

        if (!promoCode.trim()) {
            return alert('Entre un code promo');
        }

        try {

            const subtotal = getSubtotal();

            const res = await fetch('/api/admin/promo-codes/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    code: promoCode,
                    parsedTotal: subtotal
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setPromoDiscount(0);
                return alert(data.error || 'Code invalide');
            }

            setPromoDiscount(data.discount);

            alert(`Code appliqué : -${data.discount.toFixed(2)}€`);

        } catch (err) {
            console.error(err);
            alert('Erreur serveur');
        }
    };
    const handleCheckout = () => {
        if (!user) return alert("Connecte-toi !");
        if (cart.length === 0) return alert("Panier vide");

        localStorage.removeItem('cart');
        setCart([]);

        navigate('/paiement', {
            state: {
                cart,
                promoCode,
            }
        });
    };

    return (
        <div className="boutique-container">

            {/* HEADER ORIGINAL RESTAURÉ */}
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

                {/* CATEGORIES */}
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

                {/* MAIN */}
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
                                            <img
                                                src={item.image_url}
                                                className="item-image"
                                                alt={item.name}
                                            />
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

                                    <div className="promo-section">
                                        <input
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                            placeholder="Code promo"
                                        />
                                        <button onClick={handleApplyPromo}>
                                            Appliquer
                                        </button>
                                    </div>

                                    <div className="cart-summary">

                                        <div className="summary-line">
                                            <span>Sous-total</span>
                                            <span>{getSubtotal().toFixed(2)}€</span>
                                        </div>

                                        {promoDiscount > 0 && (
                                            <div className="summary-line discount">
                                                <span>Réduction</span>
                                                <span>-{promoDiscount.toFixed(2)}€</span>
                                            </div>
                                        )}

                                        <div className="summary-line total">
                                            <span>Total</span>
                                            <span>{getTotal().toFixed(2)}€</span>
                                        </div>

                                    </div>

                                    <button
                                        className="checkout-btn"
                                        onClick={handleCheckout}
                                    >
                                        Paiement
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