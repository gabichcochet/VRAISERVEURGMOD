import React, { useState } from 'react';
import './Lore.css';

export default function Lore() {
    const [expandedSection, setExpandedSection] = useState(0);

    const loreContent = [
        {
            title: "Chapitre 1: Les Débuts",
            icon: "📖",
            content: "Ajoutez votre contenu ici..."
        },
        {
            title: "Chapitre 2: L'Évolution",
            icon: "⚡",
            content: "Ajoutez votre contenu ici..."
        },
        {
            title: "Chapitre 3: Les Enjeux",
            icon: "⚔️",
            content: "Ajoutez votre contenu ici..."
        },
        {
            title: "Chapitre 4: La Prophétie",
            icon: "🔮",
            content: "Ajoutez votre contenu ici..."
        },
        {
            title: "Chapitre 5: Les Personnages Clés",
            icon: "👥",
            content: "Ajoutez votre contenu ici..."
        },
        {
            title: "Chapitre 6: Les Factions",
            icon: "🏰",
            content: "Ajoutez votre contenu ici..."
        }
    ];

    return (
        <div className="lore-container">
            {/* Header */}
            <div className="lore-header">
                <div className="header-content">
                    <h1>Lore du Serveur</h1>
                    <p>Explorez l'univers de Jujutsu Kaisen sur notre serveur</p>
                    <div className="accent-bar"></div>
                </div>
            </div>

            {/* Timeline */}
            <div className="lore-timeline">
                {loreContent.map((section, index) => (
                    <div 
                        key={index} 
                        className={`timeline-item ${expandedSection === index ? 'active' : ''}`}
                        onClick={() => setExpandedSection(expandedSection === index ? -1 : index)}
                    >
                        <div className="timeline-marker">
                            <span className="chapter-number">{index + 1}</span>
                        </div>

                        <div className="timeline-content">
                            <div className="section-header">
                                <span className="section-icon">{section.icon}</span>
                                <h3>{section.title}</h3>
                                <span className={`expand-icon ${expandedSection === index ? 'open' : ''}`}>▼</span>
                            </div>

                            {expandedSection === index && (
                                <div className="section-body">
                                    <p>{section.content}</p>
                                    <div className="section-decoration">
                                        <div className="deco-item"></div>
                                        <div className="deco-item"></div>
                                        <div className="deco-item"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Features */}
            <div className="lore-features">
                <h2>Éléments Clés de Notre Univers</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <span className="feature-icon">🌀</span>
                        <h4>Curseurs</h4>
                        <p>Entités magiques puissantes et terrifiantes qui menacent le monde</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">⚡</span>
                        <h4>Jujutsu</h4>
                        <p>L'art martial ancien de combat contre les curseurs</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">🎓</span>
                        <h4>École Jujutsu</h4>
                        <p>Institution dédiée à l'entraînement des sorciers</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">💎</span>
                        <h4>Trésors Jujutsu</h4>
                        <p>Artefacts puissants avec des propriétés uniques</p>
                    </div>
                </div>
            </div>

            {/* Call to action */}
            <div className="lore-cta">
                <h2>Prêt à rejoindre l'aventure ?</h2>
                <p>Connectez-vous et découvrez le monde des sorciers jujutsu</p>
                <button className="cta-btn">Rejoindre le Serveur</button>
            </div>
        </div>
    );
}
