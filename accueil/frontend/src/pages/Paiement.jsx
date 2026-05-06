import React, { useState, useEffect } from 'react';
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
    const [paypalOrderId, setPaypalOrderId] = useState(null);

    // Récupérer les données du panier depuis l'état de navigation
    const { cart, promoCode, promoDiscount, totalPrice } = location.state || {};

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (user && cart && cart.length > 0) {
            initializePayment();
        }
    }, [user, cart]);

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
            console.error('Erreur auth:', err);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const initializePayment = async () => {
        try {
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
                const data = await res.json();
                setPaymentIntent(data);
                // Pour PayPal, rediriger immédiatement vers l'URL d'approbation
                if (data.approvalUrl) {
                    window.location.href = data.approvalUrl;
                }
            } else {
                const err = await res.json();
                setError(err.error || 'Erreur lors de l\'initialisation du paiement');
            }
        } catch (err) {
            console.error('Erreur paiement:', err);
            setError('Erreur de connexion');
        }
    };

    const handlePayment = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setError(null);

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
                const data = await res.json();
                // Rediriger vers la page de succès
                navigate('/paiement/succes', {
                    state: {
                        orderId: data.orderId,
                        items: cart,
                        total: totalPrice - promoDiscount
                    }
                });
            } else {
                const err = await res.json();
                setError(err.error || 'Erreur lors du paiement');
            }
        } catch (err) {
            console.error('Erreur paiement:', err);
            setError('Erreur de connexion');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="paiement-loading">Chargement...</div>;
    }

    if (!cart || cart.length === 0) {
        return (
            <div className="paiement-error">
                <h1>Panier vide</h1>
                <p>Retournez à la boutique pour ajouter des articles.</p>
                <button onClick={() => navigate('/boutique')}>Retour à la boutique</button>
            </div>
        );
    }

    return (
        <div className="paiement-container">
            <div className="paiement-header">
                <h1>Paiement sécurisé</h1>
                <p>Vérifiez votre commande et procédez au paiement</p>
            </div>

            <div className="paiement-content">
                {/* Résumé de la commande */}
                <div className="order-summary">
                    <h2>Résumé de la commande</h2>

                    <div className="order-items">
                        {cart.map(item => (
                            <div key={item.id} className="order-item">
                                <div className="item-info">
                                    <h4>{item.name}</h4>
                                    <p>Quantité: {item.quantity}</p>
                                </div>
                                <div className="item-price">
                                    {(item.price * item.quantity).toFixed(2)}€
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="order-totals">
                        <div className="total-row">
                            <span>Sous-total:</span>
                            <span>{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}€</span>
                        </div>

                        {promoDiscount > 0 && (
                            <div className="total-row discount">
                                <span>Code promo ({promoCode}):</span>
                                <span>-{promoDiscount.toFixed(2)}€</span>
                            </div>
                        )}

                        <div className="total-row total">
                            <span>Total:</span>
                            <span>{(totalPrice - promoDiscount).toFixed(2)}€</span>
                        </div>
                    </div>
                </div>

                {/* Formulaire de paiement */}
                <div className="payment-form">
                    <h2>Informations de paiement</h2>

                    {error && (
                        <div className="payment-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handlePayment}>
                        <div className="form-group">
                            <label>Email de confirmation</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                readOnly
                                className="readonly-input"
                            />
                        </div>

                        <div className="payment-notice">
                            <p>🔒 Paiement sécurisé via PayPal</p>
                            <p>Vous allez être redirigé vers PayPal pour finaliser votre paiement.</p>
                        </div>

                        {!paymentIntent ? (
                            <div className="payment-loading">
                                <div className="loading-spinner">⏳</div>
                                <p>Préparation du paiement PayPal...</p>
                            </div>
                        ) : (
                            <div className="payment-redirect">
                                <p>🔄 Redirection vers PayPal en cours...</p>
                                <p>Si la redirection ne fonctionne pas, <a href={paymentIntent.approvalUrl} target="_blank" rel="noopener noreferrer">cliquez ici</a></p>
                            </div>
                        )}
                    </form>

                    <div className="payment-security">
                        <div className="security-badges">
                            <span>🔒 SSL</span>
                            <span>💳 PayPal</span>
                            <span>✅ Sécurisé</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="paiement-footer">
                <button
                    className="back-btn"
                    onClick={() => navigate('/boutique')}
                    disabled={processing}
                >
                    ← Retour à la boutique
                </button>
            </div>
        </div>
    );
}
