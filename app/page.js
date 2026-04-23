"use client";

import { useState } from "react";

export default function Home() {
  const [img, setImg] = useState(null);
  const [gabarito, setGabarito] = useState("");
  const [resposta, setResposta] = useState("");

  const enviar = async () => {
    const r = await fetch("/api/corrigir", {
      method: "POST",
      body: JSON.stringify({ img, gabarito })
    });

    const data = await r.json();
    setResposta(data.resultado);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📸 CorrigeFácil</h1>

      <textarea
        placeholder="Digite o gabarito"
        value={gabarito}
        onChange={(e) => setGabarito(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => setImg(reader.result);
          reader.readAsDataURL(file);
        }}
      />

      <button onClick={enviar}>Corrigir</button>

      <pre>{resposta}</pre>
    </div>
  );
}
