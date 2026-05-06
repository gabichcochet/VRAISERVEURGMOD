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

    const { cart, promoCode, promoDiscount, totalPrice } = location.state || {};

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (user && cart && cart.length > 0 && !paymentInitializedRef.current) {
            paymentInitializedRef.current = true;
            initializePayment();
        }
    }, [user, cart]);

    useEffect(() => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalLoginEmail);
        setEmailValid(isValid);
    }, [paypalLoginEmail]);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/me', { credentials: 'include' });

            if (res.ok) {
                const data = await res.json();
                if (data.loggedIn) {
                    setUser(data.user);
                } else {
                    navigate('/auth/steam');
                }
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error(err);
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
            setError("Veuillez entrer un email valide avant de continuer.");
            return;
        }

        if (paymentIntent?.approvalUrl) {
            window.location.href = paymentIntent.approvalUrl;
            return;
        }

        setProcessing(true);

        try {
            const res = await fetch('/api/shop/confirm-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    paypalOrderId: paymentIntent.paypalOrderId,
                    orderId: paymentIntent.orderId
                })
            });

            if (res.ok) {
                navigate('/paiement/succes', {
                    state: {
                        orderId: paymentIntent.orderId,
                        items: cart,
                        total: totalPrice - promoDiscount
                    }
                });
            } else {
                const err = await res.json();
                setError(err.error);
            }
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

                    {cart.map(item => (
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

                    {/* 🔵 TOTAL SOUS LE RÉSUMÉ */}
                    <div className="order-total-box">
                        <span>Total :</span>
                        <span className="order-total-amount">
                            {(totalPrice - promoDiscount).toFixed(2)}€
                        </span>
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
                                onChange={(e) => setPaypalLoginEmail(e.target.value)}
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
                <button className="back-btn" onClick={() => navigate('/boutique')}>
                    ← Retour boutique
                </button>
            </div>

        </div>
    );
}
