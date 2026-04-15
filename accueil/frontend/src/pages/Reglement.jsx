import React from 'react';
import './Reglement.css';

export default function Reglement() {
    const sections = [
        {
            title: "1. Règles Générales",
            icon: "📋",
            content: [
                "Respectez tous les joueurs, aucune insulte ou harcèlement toléré",
                "Pas de spam ou de flood dans le chat",
                "Pas de contenu adulte, violent ou offensant",
                "Pas de publicité pour d'autres serveurs ou services",
                "Respectez les décisions des modérateurs et admins"
            ]
        },
        {
            title: "2. Comportement en Jeu",
            icon: "🎮",
            content: [
                "Jeu équitable sans cheats, glitches ou exploits",
                "Pas de grief (destruction intentionnelle de constructions)",
                "Pas de PvP non consentant (sauf zones PvP désignées)",
                "Pas d'AFK farming (récolte AFK non autorisée)",
                "Respect des zones privées d'autres joueurs"
            ]
        },
        {
            title: "3. Chat et Communication",
            icon: "💬",
            content: [
                "Utilisez le chat de manière respectueuse et constructive",
                "Pas de spam de majuscules ou de caractères spéciaux",
                "Évitez les discussions politiques et religieuses",
                "Les blagues doivent rester appropriées",
                "Pas de divulgation d'informations personnelles"
            ]
        },
        {
            title: "4. Économie et Transactions",
            icon: "💰",
            content: [
                "Aucune transaction RMT (Real Money Trade) autorisée",
                "Les achats à la boutique doivent être légitimes",
                "Pas de duplication d'items ou d'argent",
                "Les escroqueries causeront un ban permanent",
                "Respectez les prix du marché établis"
            ]
        },
        {
            title: "5. Sanctions",
            icon: "⚖️",
            content: [
                "Warning: Premier avertissement pour infraction mineure",
                "Mute: Interdiction temporaire de chat (24h - 7j)",
                "Ban: Interdiction d'accès au serveur (temporaire ou permanent)",
                "Les bans multiples peuvent entraîner un ban permanent",
                "Les appels de ban doivent être faits respectueusement"
            ]
        },
        {
            title: "6. Modifications et Client",
            icon: "🛠️",
            content: [
                "Seuls les mods approuvés sont autorisés",
                "Les clients modifiés donnant un avantage sont interdits",
                "Pas de texture packs 'unfair'",
                "Les exploits de mods = ban automatique",
                "Contactez un admin si vous avez des questions"
            ]
        },
        {
            title: "7. Droits d'Auteur et Contenu",
            icon: "©️",
            content: [
                "Respectez les droits d'auteur des créateurs",
                "Pas de contenu plagié ou volé",
                "Les créations originales sont encouragées",
                "Crédit aux créateurs quand vous utilisez leur travail",
                "Les violations seront signalées aux autorités appropriées"
            ]
        },
        {
            title: "8. Appels et Disputes",
            icon: "🤝",
            content: [
                "Les disputes doivent être résolvues respectueusement",
                "Les admins ont le dernier mot",
                "Les appels doivent être faits en MP avec un admin",
                "Pas de discussion publique des sanction"
            ]
        }
    ];

    return (
        <div className="reglement-container">
            {/* Header */}
            <div className="reglement-header">
                <h1>📜 Règlement du Serveur</h1>
                <p>Tous les joueurs doivent respecter ces règles pour une expérience positive</p>
            </div>

            {/* Intro */}
            <div className="reglement-intro">
                <h2>Bienvenue sur notre serveur !</h2>
                <p>
                    Ce serveur est une communauté basée sur le respect mutuel et le plaisir de jouer ensemble. 
                    Les règles ci-dessous existent pour garantir une expérience équitable et agréable pour tous.
                </p>
            </div>

            {/* Sections */}
            <div className="reglement-sections">
                {sections.map((section, index) => (
                    <div key={index} className="regulation-section">
                        <div className="section-header">
                            <span className="section-icon">{section.icon}</span>
                            <h2>{section.title}</h2>
                        </div>
                        <ul className="section-content">
                            {section.content.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="reglement-footer">
                <div className="footer-box">
                    <h3>⚠️ Important</h3>
                    <p>
                        Le non-respect de ces règles peut entraîner un warning, un mute ou un ban. 
                        Les modérateurs et administrateurs se réservent le droit de prendre les mesures nécessaires.
                    </p>
                </div>
                <div className="footer-box">
                    <h3>❓ Questions ?</h3>
                    <p>
                        Si vous avez des questions sur le règlement, contactez un modérateur ou admin 
                        en jeu ou sur Discord.
                    </p>
                </div>
                <div className="footer-box">
                    <h3>✅ Acceptation</h3>
                    <p>
                        En jouant sur ce serveur, vous acceptez automatiquement ces règles et vous engagez 
                        à les respecter.
                    </p>
                </div>
            </div>

            {/* Timeline des sanctions */}
            <div className="sanctions-timeline">
                <h2>Progression des Sanctions</h2>
                <div className="timeline">
                    <div className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <h4>Avertissement</h4>
                            <p>Premier rappel des règles</p>
                        </div>
                    </div>
                    <div className="timeline-arrow">→</div>
                    <div className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <h4>Mute 24h</h4>
                            <p>Interdiction de chat temporaire</p>
                        </div>
                    </div>
                    <div className="timeline-arrow">→</div>
                    <div className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <h4>Ban Temporaire</h4>
                            <p>Accès refusé 3-7 jours</p>
                        </div>
                    </div>
                    <div className="timeline-arrow">→</div>
                    <div className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <h4>Ban Permanent</h4>
                            <p>Retrait du serveur définitif</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
