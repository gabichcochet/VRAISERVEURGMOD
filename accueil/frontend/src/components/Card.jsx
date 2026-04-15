import React from "react";
import { Link } from "react-router-dom";
import "../css/theme.css";



export default function Card({ title, image = "", link = '#'}) {
    return (
        <Link to={link} className="card">
            <div 
                className="card-img"   
                style={{ backgroundImage: `url(${image})` }}>
                </div>
            <h3>{title}</h3>
        </Link>
    );
}