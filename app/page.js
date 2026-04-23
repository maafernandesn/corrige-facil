"use client";

import { useState } from "react";

export default function Home() {
  const [img, setImg] = useState(null);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");

  const enviar = async () => {
    try {
      setResposta("Testando IA... ⏳");

      const baseUrl = window.location.origin;

      const r = await fetch(`${baseUrl}/api/corrigir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ img, pergunta })
      });

      const data = await r.json();

      setResposta(
        data.resultado ||
        data.erro ||
        data.detalhe ||
        "Sem resposta"
      );

    } catch (err) {
      console.error(err);
      setResposta("Erro na conexão ❌");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📸 CorrigeFácil IA</h1>

      <textarea
        placeholder="Digite algo ou peça para testar a IA"
        value={pergunta}
        onChange={(e) => setPergunta(e.target.value)}
        style={{ width: "100%", height: 80 }}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];

          if (!file) return;

          const reader = new FileReader();
          reader.onloadend = () => setImg(reader.result);
          reader.readAsDataURL(file);
        }}
      />

      <button onClick={enviar} style={{ marginTop: 10 }}>
        Enviar
      </button>

      <pre style={{ marginTop: 20 }}>{resposta}</pre>
    </div>
  );
}