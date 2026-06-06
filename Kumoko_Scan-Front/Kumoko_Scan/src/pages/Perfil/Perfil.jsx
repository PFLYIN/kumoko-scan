import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../service/api"; 

import "./Perfil.css";
function Perfil() {
  const { user, setUser, logout } = useContext(AuthContext);
  const [nome, setNome] = useState(user?.nome || '');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await api.put('/profile', { nome, cpf, senha }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert("Perfil atualizado com sucesso!");
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao atualizar perfil.");
    }
  };

  return (
    <main className="auth-main">
      <div className="auth-wrapper" style={{ justifyContent: 'center' }}>
        <section className="auth-right">
          <div className="auth-card">
            <h3 className="card-title">Configurações de Perfil</h3>
            
            <form onSubmit={handleUpdate}>
              <div className="field">
                <label>E-mail (Permanente)</label>
                <input type="text" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="field">
                <input type="text" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} required />
              </div>
              <div className="field">
                <input type="text" placeholder="Confirme seu CPF" value={cpf} onChange={e => setCpf(e.target.value)} required />
              </div>
              <div className="field">
                <input type="password" placeholder="Nova Senha" value={senha} onChange={e => setSenha(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary">Salvar Alterações</button>
            </form>

            <button onClick={logout} className="logout-link" style={{ marginTop: '20px', color: '#dc3545', border: 'none', background: 'none', cursor: 'pointer' }}>
              Sair da conta
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Perfil;