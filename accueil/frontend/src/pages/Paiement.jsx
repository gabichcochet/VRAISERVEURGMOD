import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Paiement.css';

export default function Paiement() {
    const location = useLocation();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentIntent, setPaymentIntent] = useState(null);
    const [error, setError] = useState(null);

    const [paypalLoginEmail, setPaypalLoginEmail] = useState('');
    const [emailValid, setEmailValid] = useState(false);
    const paymentInitializedRef = useRef(false);
    // 3. useEffect (ICI et seulement ici)
    useEffect(() => {
        checkAuth();
    }, []);
    const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

const { cart = [], promoCode = null, promoDiscount = 0 } = location.state || {};

const subtotal = Array.isArray(cart)
    ? cart.reduce((sum, item) => {
        return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
    }, 0)
    : 0;

// priorité backend > frontend
const backendDiscount = Number(paymentIntent?.discount ?? promoDiscount ?? 0);

const total = Math.max(subtotal - backendDiscount, 0);

const checkAuth = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/me', {
            credentials: 'include'
        });

        const text = await res.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            console.error("API /me invalide:", text);
            navigate('/');
            return;
        }

        if (!data.loggedIn) {
            navigate('/auth/steam');
            return;
        }

        setUser(data.user);

    } catch (err) {
        console.error("AUTH ERROR:", err);
        navigate('/');
    } finally {
        setLoading(false);
    }
    };
    const initializePayment = async () => {
        try {
            setError(null);

            const res = await fetch('/api/shop/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    items: cart.map(i => ({ itemId: i.id, quantity: i.quantity })),
                    promoCode: promoCode || null
                })
            });

            if (res.ok) {
                setPaymentIntent(await res.json());
            } else {
                const err = await res.json();
                setError(err.error || 'Erreur paiement');
            }
        } catch (err) {
            setError('Erreur serveur');
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        if (!emailValid) {
            setError("Email invalide");
            return;
        }

        setProcessing(true);

        try {
            let intent = paymentIntent;

            // 1. créer paiement si pas encore existant
            if (!intent) {
                const res = await fetch('/api/shop/create-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        items: cart.map(i => ({ itemId: i.id, quantity: i.quantity })),
                        promoCode: promoCode || null
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Erreur paiement");
                    setProcessing(false);
                    return;
                }

                setPaymentIntent(data);
                intent = data;

                // 🔥 IMPORTANT : STOP ici
                if (intent.approvalUrl) {
                    window.location.href = intent.approvalUrl;
                    return;
                }
            }

            // 2. confirm (si retour PayPal déjà fait)
            const res = await fetch('/api/shop/confirm-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    paypalOrderId: intent.paypalOrderId,
                    orderId: intent.orderId
                })
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || "Erreur confirmation");
                return;
            }

            navigate('/paiement/succes', {
                state: {
                    orderId: intent.orderId,
                    items: cart,
                    total
                }
            });

        } catch (err) {
            setError("Erreur connexion");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="paiement-loading">Chargement...</div>;

    if (!cart || cart.length === 0) {
        return (
            <div className="paiement-error">
                <h1>Panier vide</h1>
                <button onClick={() => navigate('/boutique')}>
                    Retour boutique
                </button>
            </div>
        );
    }

    return (
        <div className="paiement-container">

            <div className="paiement-header">
                <h1>Paiement sécurisé</h1>
                <p>Finalisez votre commande</p>
            </div>

            <div className="paiement-content">

                {/* RESUME */}
                <div className="order-summary">
                    <h2>Résumé</h2>

                    {(cart || []).map(item => (
                        <div key={item.id} className="order-item">
                            <div className="item-info">
                                <h4>{item.name}</h4>
                                <p>x{item.quantity}</p>
                            </div>
                            <div className="item-price">
                                {(item.price * item.quantity).toFixed(2)}€
                            </div>
                        </div>
                    ))}

                    {/* CODE PROMO */}
                    {promoCode && (
                        <div className="order-discount-box">
                            <span>Code promo appliqué :</span>
                            <span className="promo-code">
                                {promoCode.toUpperCase()}
                            </span>
                        </div>
                    )}

                    {backendDiscount > 0 && (
                        <div className="order-discount-box">
                            <span>Réduction : </span>
                            <span className="discount-amount">
                                -{backendDiscount.toFixed(2)}€
                            </span>
                        </div>
                    )}

                    {/* TOTAL */}
                    <div className="order-total-box">
                        <span>Total :</span>

                        <div className="total-price-container">

                            {backendDiscount > 0 && (
                                <div className="price-comparison">
                                    <span className="old-price">
                                        {subtotal.toFixed(2)}€
                                    </span>

                                    <span className="arrow">→</span>
                                </div>
                            )}

                            <span className="order-total-amount">
                                {total.toFixed(2)}€
                            </span>

                        </div>
                    </div>
                </div>

                {/* PAYPAL */}
                <div className="payment-form">

                    {error && <div className="payment-error">{error}</div>}

                    <form onSubmit={handlePayment}>

                        <div className="paypal-login-panel">

                            <div className="paypal-wordmark">PayPal</div>

                            <input
                                type="email"
                                placeholder="Email PayPal"
                                value={paypalLoginEmail}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setPaypalLoginEmail(value);
                                    setEmailValid(validateEmail(value));
                                }}
                            />

                            <button
                                type="submit"
                                className="paypal-next-btn"
                                disabled={!emailValid || processing}
                            >
                                {emailValid ? "Suivant" : "Entrer un email valide"}
                            </button>

                        </div>

                    </form>

                </div>

            </div>

            <div className="paiement-footer">
                <button
                    className="back-btn"
                    onClick={() => navigate('/boutique')}
                >
                    ← Retour boutique
                </button>
            </div>

        </div>
    );
}
