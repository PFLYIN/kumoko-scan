import React from 'react';

import './CardManga.css';

function CardManga({ titulo, imagem, descricao }) {
    return (
        <div className="card-manga">
            <img src={imagem} alt={titulo} className="card-imagem" />
            <h3>{titulo}</h3>
            <p>{descricao}</p>
        </div>
    );
}

export default CardManga;
