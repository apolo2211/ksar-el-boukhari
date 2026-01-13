import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("Chargement...");

  // Détecte si on est en dev (localhost) ou prod (Render)
  const getBackendURL = () => {
    if (window.location.hostname === "localhost") {
      return "http://localhost:10000/api/status"; // dev
    }
    return "https://ksar-el-boukhari.onrender.com/api/status"; // prod
  };

  useEffect(() => {
    fetch(getBackendURL())
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch(() => setStatus("Backend non accessible"));
  }, []);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "2rem" }}>
      <h1>Ksar El Boukhari SaaS</h1>
      <h2>Bienvenue sur Ksar El Boukhari!</h2>
      <p>Statut du backend :</p>
      <strong>{status}</strong>
    </div>
  );
}

export default App;
