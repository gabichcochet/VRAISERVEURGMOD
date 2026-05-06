import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PaiementSucces.css';

export default function PaiementSucces() {
    const location = useLocation();
    const navigate = useNavigate();
    const { orderId, items, total } = location.state || {};

    if (!orderId) {
        return (
            <div className="success-error">
                <h1>Erreur</h1>
                <p>Informations de commande manquantes.</p>
                <button onClick={() => navigate('/boutique')}>Retour à la boutique</button>
            </div>
        );
    }

    return (
        <div className="success-container">
            <div className="success-header">
                <div className="success-icon">✅</div>
                <h1>Paiement réussi !</h1>
                <p>Votre commande a été traitée avec succès</p>
            </div>

            <div className="success-content">
                <div className="order-details">
                    <h2>Détails de la commande</h2>

                    <div className="order-info">
                        <div className="info-row">
                            <span>N° de commande:</span>
                            <span className="order-number">#{orderId}</span>
                        </div>
                        <div className="info-row">
                            <span>Date:</span>
                            <span>{new Date().toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="info-row">
                            <span>Total payé:</span>
                            <span className="total-amount">{total?.toFixed(2)}€</span>
                        </div>
                    </div>

                    <div className="ordered-items">
                        <h3>Articles commandés</h3>
                        {items?.map((item, index) => (
                            <div key={index} className="success-item">
                                <div className="item-details">
                                    <h4>{item.name}</h4>
                                    <p>Quantité: {item.quantity}</p>
                                </div>
                                <div className="item-price">
                                    {(item.price * item.quantity).toFixed(2)}€
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="success-notice">
                    <h3>Que se passe-t-il maintenant ?</h3>
                    <ul>
                        <li>✅ Votre paiement a été traité</li>
                        <li>⏳ Les articles seront livrés dans votre inventaire de jeu</li>
                        <li>📧 Un email de confirmation vous sera envoyé</li>
                        <li>💬 En cas de problème, contactez le support</li>
                    </ul>
                </div>

                <div className="success-actions">
                    <button
                        className="primary-btn"
                        onClick={() => navigate('/profil')}
                    >
                        Voir mon profil
                    </button>
                    <button
                        className="secondary-btn"
                        onClick={() => navigate('/boutique')}
                    >
                        Continuer mes achats
                    </button>
                </div>
            </div>
        </div>
    );
}
