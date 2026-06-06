import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../service/api';
import './CriarManga.css';

function EditarManga() {
  const [nome, setNome] = useState('');
  const [volume, setVolume] = useState('');
  const [capa, setCapa] = useState(null);
  const [capaAtual, setCapaAtual] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Acesso restrito! Por favor, faça login.");
      navigate('/auth');
    }
  }, [navigate]);

  useEffect(() => {
    const buscarManga = async () => {
      try {
        const res = await api.get(`/mangas/${id}`);
        const manga = res.data;
        setNome(manga.nome);
        setVolume(manga.volume);
        setCapaAtual(manga.capa_url);
      } catch (error) {
        alert("Erro ao carregar mangá.");
        navigate('/manga');
      }
    };
    buscarManga();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('volume', volume);
    if (capa) {
      formData.append('capa', capa);
    }

    try {
      await api.put(`/mangas/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      alert('Mangá atualizado com sucesso!');
      navigate('/manga');
    } catch (error) {
      alert("Erro ao atualizar mangá. Verifique se você ainda está logado.");
    }
  };

  return (
    <main className="auth-main">
      <div className="auth-wrapper" style={{ justifyContent: 'center' }}>
        <section className="auth-right">
          <div className="auth-card">
            <div className="tab-panel">
              <h3 className="card-title">Editar Mangá</h3>
              
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
                  {capaAtual && (
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{color: '#8b9bb4', fontSize: '12px', marginBottom: '5px', display: 'block'}}>Capa Atual:</label>
                      <img 
                        src={`http://localhost:3000/files/${capaAtual.replace(/\\/g, '/').split('uploads/')[1]}`} 
                        alt="Capa atual" 
                        style={{ maxWidth: '100px', maxHeight: '150px' }}
                      />
                    </div>
                  )}
                   <label style={{color: '#8b9bb4', fontSize: '12px', marginBottom: '5px', display: 'block'}}>Nova Capa (opcional)</label>
                  <input 
                    type="file" 
                    onChange={e => setCapa(e.target.files[0])} 
                    accept="image/*" 
                    style={{ color: '#fff' }}
                  />
                </div>
                
                <button type="submit" className="btn-primary">Atualizar Mangá</button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default EditarManga;