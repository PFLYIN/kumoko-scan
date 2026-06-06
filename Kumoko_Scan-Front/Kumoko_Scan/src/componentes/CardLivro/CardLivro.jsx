import React from 'react';
import './CardLivro.css';

function CardLivro({ titulo, imagem, descricao }) {
    return (
        <div className="card-livro">
            <img src={imagem} alt={titulo} className="card-imagem" />
            <h3>{titulo}</h3>
            <p>{descricao}</p>
        </div>
    );
}

export default CardLivro;
