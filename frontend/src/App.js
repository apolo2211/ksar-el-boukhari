import { useState, useEffect } from 'react';

const API = window.location.origin;

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  const register = async () => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    setMessage(data.message);
  };

  const login = async () => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.token) {
      localStorage.setItem('token', data.token);
      loadProfile();
    } else {
      setMessage(data.message);
    }
  };

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Ksar El Boukhari SaaS</h1>

      {user ? (
        <>
          <p>Connecté : {user.email}</p>
          <button onClick={logout}>Déconnexion</button>
        </>
      ) : (
        <>
          <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
          <br />
          <input type="password" placeholder="Mot de passe" onChange={e => setPassword(e.target.value)} />
          <br />
          <button onClick={register}>Créer compte</button>
          <button onClick={login}>Connexion</button>
          <p>{message}</p>
        </>
      )}
    </div>
  );
}

export default App;
