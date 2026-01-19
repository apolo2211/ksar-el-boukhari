import { useEffect, useState } from 'react';

const API = window.location.origin.includes('localhost') ? 'http://localhost:10000' : '';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch(API + '/api/auth/me', {
            headers: { Authorization: 'Bearer ' + token }
          });
          if (res.ok) setUser(await res.json());
        } catch (e) { console.error("Erreur session"); }
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setMsg("Vérification...");
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await fetch(API + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        window.location.reload();
      } else {
        setMsg(data.message || "Erreur d'accès");
      }
    } catch (err) { setMsg("Erreur réseau"); }
  };

  if (loading) return <h2 style={{textAlign:'center'}}>Chargement en cours...</h2>;

  if (!user) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <h1>Connexion au Ksar</h1>
        <form onSubmit={handleAuth} style={{padding: 20, border: '1px solid #ccc', display:'inline-block'}}>
          <input type="email" placeholder="Email" style={{display:'block', marginBottom:10}} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Mot de passe" style={{display:'block', marginBottom:10}} onChange={e=>setPassword(e.target.value)} required />
          <button type="submit" style={{width:'100%', background:'blue', color:'white'}}>{isRegistering ? "S'inscrire" : "Se connecter"}</button>
        </form>
        <p style={{color:'red'}}>{msg}</p>
        <button onClick={() => setIsRegistering(!isRegistering)} style={{marginTop:10}}>
          {isRegistering ? "Aller à la connexion" : "Créer un compte"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
      <h1 style={{color: 'green'}}>✅ ACCÈS RÉUSSI !</h1>
      <h2>Bienvenue dans votre espace, {user.email}</h2>
      <p>Votre compte est actuellement : <b>{user.isPremium ? "💎 PREMIUM" : "GRATUIT"}</b></p>
      
      <div style={{margin: '30px', padding: '20px', background: '#f9f9f9', border: '2px dashed #ccc'}}>
        <p>Si vous voyez ce message, le serveur fonctionne parfaitement.</p>
        <p>Le bouton PayPal sera réactivé une fois ce test validé.</p>
      </div>

      <button onClick={() => { localStorage.clear(); window.location.reload(); }}>Déconnexion</button>
    </div>
  );
}

export default App;