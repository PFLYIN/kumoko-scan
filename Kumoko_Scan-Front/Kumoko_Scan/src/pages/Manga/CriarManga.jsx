import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../service/api';
import './CriarManga.css';

function CriarManga() {
  const [nome, setNome] = useState('');
  const [volume, setVolume] = useState('');
  const [capa, setCapa] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Acesso restrito! Por favor, faça login.");
      navigate('/auth');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('volume', volume);
    formData.append('capa', capa);

    try {
      await api.post('/mangas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      alert('Manga lançado com sucesso na Kumoko Scan! 🕷️');
      setNome('');
      setVolume('');
      setCapa(null);
    } catch (error) {
      alert("Erro ao lançar obra. Verifique se você ainda está logado.");
    }
  };

  return (
    <main className="auth-main">
      <div className="auth-wrapper" style={{ justifyContent: 'center' }}>
        <section className="auth-right">
          <div className="auth-card">
            <div className="tab-panel">
              <h3 className="card-title">Lançar Nova Obra</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <input 
                    type="text" 
                    placeholder="Nome do Mangá" 
                    value={nome} 
                    onChange={e => setNome(e.target.value)} 
                    required 
                  />
                </div>
                <div className="field">
                  <input 
                    type="number" 
                    placeholder="Volume" 
                    value={volume} 
                    onChange={e => setVolume(e.target.value)} 
                    required 
                  />
                </div>
                <div className="field">
                   <label style={{color: '#8b9bb4', fontSize: '12px', marginBottom: '5px', display: 'block'}}>Capa do Mangá</label>
                  <input 
                    type="file" 
                    onChange={e => setCapa(e.target.files[0])} 
                    accept="image/*" 
                    required 
                    style={{ color: '#fff' }}
                  />
                </div>
                
                <button type="submit" className="btn-primary">Cadastrar Mangá</button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default CriarManga;