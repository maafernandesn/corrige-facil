"use client";

import { useState } from "react";

export default function Home() {
  const [img, setImg] = useState(null);
  const [gabarito, setGabarito] = useState("");
  const [resposta, setResposta] = useState("");

  const enviar = async () => {
    if (!img || !gabarito) {
      alert("Envie imagem e gabarito");
      return;
    }

    const r = await fetch("/api/corrigir", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ img, gabarito })
    });

    const data = await r.json();
    setResposta(data.resultado || data.erro);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📸 CorrigeFácil</h1>

      <textarea
        placeholder="Ex: 1-C, 2-C, 3-D"
        value={gabarito}
        onChange={(e) => setGabarito(e.target.value)}
        style={{ width: "100%", height: 80 }}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const reader = new FileReader();
          reader.onloadend = () => setImg(reader.result);
          reader.readAsDataURL(e.target.files[0]);
        }}
      />

      <button onClick={enviar}>Corrigir</button>

      <pre>{resposta}</pre>
    </div>
  );
}