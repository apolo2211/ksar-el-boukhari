import { useEffect, useState } from 'react';

const API = window.location.origin.includes('localhost') ? 'http://localhost:10000' : window.location.origin;

function App() {
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => {
    // On n'affiche le bouton QUE si l'utilisateur est connecté et non-premium
    if (user && !user.isPremium) {
      const checkPaypal = setInterval(() => {
        if (window.paypal) {
          clearInterval(checkPaypal);
          window.paypal.Buttons({
            createOrder: (data, actions) => {
              return actions.order.create({ purchase_units: [{ amount: { value: '20.00' } }] });
            },
            onApprove: async (data, actions) => {
              await actions.order.capture();
              const token = localStorage.getItem('token');
              await fetch(`${API}/api/auth/make-premium`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
              });
              alert("Succès ! Vous êtes Premium 💎");
              window.location.reload();
            }
          }).render('#paypal-button-container');
        }
      }, 500);
    }
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const res = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) { localStorage.setItem('token', data.token); loadProfile(); }
  };

  if (!user) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <h2>Ksar El Boukhari</h2>
        <form onSubmit={handleAuth}>
          <input placeholder="Email" onChange={e => setEmail(e.target.value)} /><br/>
          <input type="password" placeholder="Pass" onChange={e => setPassword(e.target.value)} /><br/>
          <button type="submit">{isRegistering ? 'S\'inscrire' : 'Connexion'}</button>
        </form>
        <p onClick={() => setIsRegistering(!isRegistering)} style={{cursor:'pointer', color:'blue'}}>Changer</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h1>Bonjour, {user.email}</h1>
      <p>Statut : <strong>{user.isPremium ? '💎 Premium' : '🆓 Gratuit'}</strong></p>
      {!user.isPremium && (
        <div style={{maxWidth: '300px', margin: '20px auto'}}>
          <div id="paypal-button-container"></div>
        </div>
      )}
      <button onClick={() => { localStorage.clear(); window.location.reload(); }}>Déconnexion</button>
    </div>
  );
}

export default App;