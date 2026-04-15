import React from 'react';


export default function Accueil() {
    return (
        <div className="Accueil">
            <header className="header">
                <h1>JUJUTSU Kaisen GMod</h1>
                <p>Bienvenue sur notre site de GMod sur JUJUTSU Kaisen </p>
            </header>
            <section className="sections">
                <div className="card">Boutique</div>
                <div className="card">Membres</div>
                <div className="card">Serveur</div>
                <div className="card">Documentation</div>
            </section>
        </div>
    );
}