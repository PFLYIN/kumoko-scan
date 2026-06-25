import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../service/api';
import './CriarLivro.css'; // Usamos o mesmo CSS do CriarLivro para economizar tempo

function EditarLivro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');

  useEffect(() => {
    // 🎯 Busca o livro pelo ID para preencher o input
    const buscarLivro = async () => {
      try {
        const res = await api.get(`/livros/${id}`);
        setNome(res.data.nome || '');
      } catch (error) {
        console.error("Erro ao buscar detalhes do livro.", error);
      }
    };
    buscarLivro();
  }, [id]);

  const handleEditarLivro = async (e) => {
    e.preventDefault();
    if (!nome) return alert("O nome do livro é obrigatório!");

    try {
      await api.put(`/livros/${id}`, { nome });
      alert('Livro editado com sucesso!');
      navigate('/livros'); // Redireciona de volta para a lista
    } catch (erro) {
      alert('Erro ao editar livro.');
    }
  };

  return (
    <div className="container-criar-livro">
      <h2>Editar Livro</h2>
      <form onSubmit={handleEditarLivro} className="form-livro">
        <div className="grupo-input">
          <label>Título do Livro</label>
          <input 
            type="text" 
            value={nome} 
            onChange={e => setNome(e.target.value)} 
          />
        </div>
        <button type="submit" className="btn-salvar-livro">Atualizar Livro</button>
      </form>
    </div>
  );
}

export default EditarLivro;