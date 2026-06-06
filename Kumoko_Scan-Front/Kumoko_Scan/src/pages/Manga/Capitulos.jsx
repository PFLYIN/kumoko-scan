import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../service/api';
import './Capitulos.css';

function Capitulos() {
  const { mangaId } = useParams();

  const [capitulos, setCapitulos] = useState([]);
  const [numCap, setNumCap] = useState('');
  const [tituloCap, setTituloCap] = useState('');

  const carregarCapitulos = async () => {
    try {
      const res = await api.get(`/capitulos/manga/${mangaId}`);
      setCapitulos(res.data);
    } catch (err) { alert("Erro ao carregar capítulos."); }
  };

  useEffect(() => {
    carregarCapitulos();
  }, [mangaId]);

  const handleCriarCapitulo = async (e) => {
    e.preventDefault();
    if (!numCap) return alert("Digite o número do capítulo!");

    try {
      await api.post('/capitulos', { manga_id: mangaId, numero: Number(numCap), titulo: tituloCap });
      setNumCap(''); setTituloCap('');
      carregarCapitulos(); 
    } catch (err) { alert("Erro ao criar capítulo."); }
  };

  const handleAnexarPagina = async (e, capituloId) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('page_image', file); 

    try {
      await api.post(`/page/${mangaId}/${capituloId}/1`, formData);
      alert('Página anexada com sucesso!');
    } catch (err) { alert('Erro ao subir página.'); }
  };

  const handleLerCapitulo = async (capituloId) => {
    try {
      const res = await api.get(`/page/${capituloId}`);
      if (res.data?.imagem_url) {
        const urlLimpa = res.data.imagem_url.replace(/\\/g, '/').split('uploads/')[1];
        window.open(`http://localhost:3000/files/${urlLimpa}`, '_blank');
      } else { alert('Nenhuma página anexada!'); }
    } catch (err) { alert('Capítulo vazio ou erro ao ler.'); }
  };

  return (
    <div className="container-capitulos">
      <Link to="/mangas" className="btn-voltar">⬅ Voltar ao Catálogo</Link>
      
      <h2>Gerenciar Capítulos</h2>
      <div className="section-intro">
        <p>Gerencie os capítulos do mangá e anexe páginas direto aqui. Tudo preparado para criar e revisar com facilidade.</p>
      </div>
      
      <form onSubmit={handleCriarCapitulo} className="form-criar-capitulo">
        <input type="number" placeholder="Nº Cap" value={numCap} onChange={e => setNumCap(e.target.value)} />
        <input type="text" placeholder="Título (opcional)" value={tituloCap} onChange={e => setTituloCap(e.target.value)} />
        <button type="submit" className="btn-adicionar">Adicionar</button>
      </form>

      <ul className="lista-capitulos">
        {capitulos.map(cap => (
          <li key={cap.id} className="item-capitulo">
            <div className="info-capitulo">
              <strong>Capítulo {cap.numero}</strong>
              {cap.titulo && <span> - {cap.titulo}</span>}
            </div>
            <div className="acoes-capitulo">
              <label className="btn-upload">
                📎 Anexar página
                <input type="file" accept="image/*" onChange={(e) => handleAnexarPagina(e, cap.id)} />
              </label>
              <button onClick={() => handleLerCapitulo(cap.id)} className="btn-ler">📖 Ler</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Capitulos;