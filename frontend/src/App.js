import { useEffect, useState } from 'react';

const API = window.location.origin.includes('localhost') ? 'http://localhost:10000' : window.location.origin;
const PAYPAL_CLIENT_ID = "AcpSdVE7R3G62JC-70OczqR0BGeuZHngYsP9sfv20t1o41Ht-MWWaykIHb9drrMW1FUnxjS2MCoP5JEl";

function App() {
  const [user, setUser] = useState(null);

  // 1. Charger le script PayPal automatiquement
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR`;
    script.addEventListener("load", () => console.log("PayPal chargé !"));
    document.body.appendChild(script);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      const res = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    }
  };

  // 2. Afficher le bouton dès que l'utilisateur est là
  useEffect(() => {
    if (user && !user.isPremium) {
      const timer = setInterval(() => {
        if (window.paypal) {
          clearInterval(timer);
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
              alert("Félicitations ! Vous êtes Premium 💎");
              window.location.reload();
            }
          }).render('#paypal-button-container');
        }
      }, 1000);
    }
  }, [user]);

  if (!user) return <div style={{textAlign:'center', padding:50}}>Veuillez vous connecter...</div>;

  return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Bonjour, {user.email}</h1>
      <p>Statut : <strong>{user.isPremium ? '💎 Premium' : '🆓 Gratuit'}</strong></p>
      
      {!user.isPremium && (
        <div style={{ marginTop: 20 }}>
          <p>Cliquez ci-dessous pour payer avec PayPal :</p>
          {/* C'est ici que les boutons vont apparaître */}
          <div id="paypal-button-container" style={{ maxWidth: '300px', margin: '0 auto' }}></div>
        </div>
      )}

      <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{marginTop: 30}}>
        Se déconnecter
      </button>
    </div>
  );
}

export default App;