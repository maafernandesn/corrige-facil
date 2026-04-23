"use client";

import { useState } from "react";

export default function Home() {
  const [img, setImg] = useState(null);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");

  const enviar = async () => {
    if (!img) {
      alert("Envie a imagem");
      return;
    }

    setResposta("Analisando... ⏳");

    const r = await fetch("/api/corrigir", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ img, pergunta })
    });

    const data = await r.json();
    setResposta(data.resultado || data.erro);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📸 CorrigeFácil IA</h1>

      <textarea
        placeholder="Ex: Corrija essa prova e dê a nota"
        value={pergunta}
        onChange={(e) => setPergunta(e.target.value)}
        style={{ width: "100%", height: 80 }}
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

      <button onClick={enviar}>Enviar</button>

      <pre style={{ marginTop: 20 }}>{resposta}</pre>
    </div>
  );
}