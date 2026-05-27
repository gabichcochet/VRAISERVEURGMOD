import React, { useState } from 'react';
import './Lore.css';

export default function Lore() {
    const [expandedSection, setExpandedSection] = useState(0);

    const loreContent = [
        {
            title: "Chapitre 1: Les Débuts",
            icon: "📖",
            content: "Bienvenue dans un monde où les fléaux rôdent dans l’ombre et où les sorciers jujutsu luttent pour préserver l’équilibre. Après les événements de Shibuya, les écoles de Tokyo et Kyoto tentent de reconstruire leurs forces. Vous incarnez un nouvel arrivant, prêt à découvrir les secrets de l’énergie maudite et à tracer votre propre voie."
        },
        {
            title: "Chapitre 2: L'Évolution",
            icon: "⚡",
            content: "Chaque sorcier commence avec une maîtrise limitée de son énergie maudite. En accomplissant des missions, en affrontant des fléaux et en étudiant les techniques interdites, vous progresserez dans les rangs — du grade 4 jusqu’au rang spécial. L’évolution n’est pas qu’une question de puissance : elle reflète votre compréhension du monde maudit et votre capacité à survivre à ses dangers."
        },
        {
            title: "Chapitre 3: Les Enjeux",
            icon: "⚔️",
            content: "Le monde est divisé entre les humains ordinaires et ceux capables de percevoir les fléaux. Les sorciers jujutsu protègent l’humanité, tandis que les fléaux cherchent à la détruire. Chaque action sur le serveur influence cet équilibre : vos choix peuvent renforcer la paix… ou précipiter le chaos. Les enjeux dépassent la simple survie : ils définissent le destin du monde."
        },
        {
            title: "Chapitre 4: La Prophétie",
            icon: "🔮",
            content: "Une ancienne prophétie annonce le retour d’un fléau ancestral, scellé depuis des siècles. Les six sceaux qui le retiennent s’affaiblissent, et certains cherchent à les briser pour libérer son pouvoir. Les joueurs devront choisir leur camp : défendre l’ordre établi ou embrasser la destruction. Des indices sur cette prophétie sont disséminés dans les quêtes et les événements du serveur."
        },
        {
            title: "Chapitre 5: Les Personnages Clés",
            icon: "👥",
            content: "Gojo Satoru, le sorcier le plus puissant ; Sukuna, le roi des fléaux ; et bien d’autres figures influentes façonnent l’histoire du serveur. Certains PNJ incarnent ces légendes, tandis que des joueurs peuvent devenir leurs héritiers spirituels. Chaque personnage a ses motivations, ses alliances et ses secrets. Apprenez à les connaître : ils détiennent les clés du lore."
        },
        {
            title: "Chapitre 6: Les Factions",
            icon: "🏰",
            content: "Le monde jujutsu est fragmenté en plusieurs factions : l’École de Tokyo, l’École de Kyoto, les Fléaux indépendants et des organisations secrètes aux intentions obscures. Chaque faction possède ses valeurs, ses objectifs et ses rivalités. Rejoindre une faction, c’est choisir un idéal : la protection, la domination ou la liberté. Votre loyauté déterminera votre avenir."
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
                        <h4>Fléaux</h4>
                        <p>Entités maudites nées des émotions humaines négatives, souvent invisibles aux yeux des civils.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">⚡</span>
                        <h4>Jujutsu</h4>
                        <p>L’art ancestral permettant de manipuler l’énergie maudite pour combattre les fléaux.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">🎓</span>
                        <h4>Écoles Jujutsu</h4>
                        <p>Institutions dédiées à la formation des sorciers et à la préservation du savoir maudit.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">💎</span>
                        <h4>Artefacts Maudits</h4>
                        <p>Objets imprégnés d’énergie maudite, parfois scellés, parfois convoités pour leur pouvoir.</p>
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
