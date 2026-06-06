import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../service/api';
import { AuthContext } from '../../context/AuthContext';
import './Auth.css';

function Auth() {
  const [activeTab, setActiveTab] = useState('login');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const navigate = useNavigate();

  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeTab === 'login') {
      try {
        const response = await api.post('/login', { email, senha });

        login(response.data.user, response.data.token);

        alert(`Bem-vindo(a) de volta, ${response.data.user.nome}!`);
        navigate('/mangas');

      } catch (error) {
        if (error.response?.status === 401) return alert('Senha incorreta!');
        if (error.response?.status === 404) return alert('E-mail não cadastrado!');
        alert('Erro no servidor ao tentar logar.');
      }

    } else {
      if (senha !== confirmarSenha) return alert('As senhas não coincidem!');

      try {
        await api.post('/register', { nome, email, cpf, senha });

        alert('Usuário criado com sucesso! Por favor, faça seu login.');

        setSenha('');
        setConfirmarSenha('');
        setCpf('');
        setActiveTab('login');

      } catch (error) {
        if (error.response?.data?.error) {
          alert(error.response.data.error);
        } else {
          alert('Erro ao registrar usuário.');
        }
      }
    }
  };

  return (
    <main className="auth-main">
      <div className="auth-wrapper">
        
        <section className="auth-left">
          <div className="brand">
            <h1 className="logo-text">KUMOKO<span>SCAN</span></h1>
          </div>
          <header className="welcome">
            <h2>Bem-vindo de volta</h2>
            <p>Acesse sua conta para gerenciar seu acervo, capítulos e volumes.</p>
          </header>
        </section>

        <section className="auth-right">
          <div className="auth-card">
            
            <div className="tabs">
              <button 
                className={`tab-btn ${activeTab === 'login' ? 'is-active' : ''}`} 
                onClick={() => setActiveTab('login')} type="button"
              >
                Entrar
              </button>
              <button 
                className={`tab-btn ${activeTab === 'register' ? 'is-active' : ''}`} 
                onClick={() => setActiveTab('register')} type="button"
              >
                Cadastrar
              </button>
            </div>

            {/* ABA DE LOGIN */}
            {activeTab === 'login' && (
              <div className="tab-panel">
                <h3 className="card-title">Acessar Conta</h3>
                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="field">
                    <input type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary">Entrar</button>
                </form>
              </div>
            )}

            {/* ABA DE CADASTRO */}
            {activeTab === 'register' && (
              <div className="tab-panel">
                <h3 className="card-title">Criar nova conta</h3>
                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <input type="text" placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} required />
                  </div>
                  <div className="field">
                    <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="field">
                    <input type="text" placeholder="CPF (Apenas números)" value={cpf} onChange={e => setCpf(e.target.value)} maxLength="11" required />
                  </div>
                  <div className="field">
                    <input type="password" placeholder="Senha (Mín. 8 caracteres)" value={senha} onChange={e => setSenha(e.target.value)} required />
                  </div>
                  <div className="field">
                    <input type="password" placeholder="Confirmar senha" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary">Cadastrar</button>
                </form>
              </div>
            )}

          </div>
        </section>
      </div>
    </main>
  );
}

export default Auth;