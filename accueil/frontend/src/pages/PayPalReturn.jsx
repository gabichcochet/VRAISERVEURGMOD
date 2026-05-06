import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './PayPalReturn.css';

export default function PayPalReturn() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');

    useEffect(() => {
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            setStatus('error');
            return;
        }

        // Confirmer le paiement PayPal
        confirmPayPalPayment(orderId);
    }, [searchParams]);

    const confirmPayPalPayment = async (orderId) => {
        try {
            const response = await fetch('/api/shop/confirm-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    paypalOrderId: 'PAYPAL_' + orderId, // Simulation
                    orderId: orderId
                })
            });

            if (response.ok) {
                const data = await response.json();
                setStatus('success');
                // Rediriger vers la page de succès après un court délai
                setTimeout(() => {
                    navigate('/paiement/succes', {
                        state: {
                            orderId: data.orderId,
                            message: 'Paiement PayPal confirmé avec succès'
                        }
                    });
                }, 2000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Erreur confirmation PayPal:', error);
            setStatus('error');
        }
    };

    return (
        <div className="paypal-return-container">
            <div className="paypal-return-content">
                {status === 'processing' && (
                    <>
                        <h1>Confirmation du paiement PayPal</h1>
                        <div className="loading-spinner">⏳</div>
                        <p>Traitement de votre paiement en cours...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <h1>✅ Paiement confirmé !</h1>
                        <p>Votre commande a été traitée avec succès.</p>
                        <p>Redirection vers la page de confirmation...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <h1>❌ Erreur de paiement</h1>
                        <p>Une erreur s'est produite lors de la confirmation du paiement.</p>
                        <button onClick={() => navigate('/boutique')}>
                            Retour à la boutique
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}