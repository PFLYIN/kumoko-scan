import React, { useState } from 'react';
import api from '../../service/api';
import './CriarLivro.css';

function CriarLivro() {
  const [nome, setNome] = useState('');
  const [capa, setCapa] = useState(null);

  const handleCriarLivro = async (e) => {
    e.preventDefault();
    if (!nome) return alert("O nome do livro é obrigatório!");

    const formData = new FormData();
    formData.append('nome', nome);
    if (capa) formData.append('cover_image', capa);

    try {
      await api.post('/livros', formData);
      alert('Livro cadastrado com sucesso!');
      setNome(''); setCapa(null);
    } catch (erro) {
      alert('Erro ao cadastrar livro. Verifique o terminal do Back-end.');
    }
  };

  return (
    <div className="container-criar-livro">
      <h2>Cadastrar Novo Livro</h2>
      <form onSubmit={handleCriarLivro} className="form-livro">
        <div className="grupo-input">
          <label>Título do Livro</label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Dom Casmurro" />
        </div>
        <div className="grupo-input">
          <label>Capa do Livro</label>
          <input type="file" accept="image/*" onChange={e => setCapa(e.target.files[0])} />
        </div>
        <button type="submit" className="btn-salvar-livro">Salvar Livro</button>
      </form>
    </div>
  );
}

export default CriarLivro;