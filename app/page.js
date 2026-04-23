"use client";

import { useState } from "react";

export default function Home() {
  const [img, setImg] = useState(null);
  const [gabarito, setGabarito] = useState("");
  const [resposta, setResposta] = useState("");

  const enviar = async () => {
    console.log("BOTÃO CLICADO");

    if (!img || !gabarito) {
      alert("Envie a imagem e preencha o gabarito");
      return;
    }

    try {
      setResposta("Corrigindo... ⏳");

      const r = await fetch("/api/corrigir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ img, gabarito })
      });

      const data = await r.json();

      console.log(data);

      setResposta(data.resultado || data.erro || "Sem resposta");

    } catch (err) {
      console.error(err);
      setResposta("Erro ao corrigir ❌");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📸 CorrigeFácil</h1>

      <textarea
        placeholder="Digite o gabarito..."
        value={gabarito}
        onChange={(e) => setGabarito(e.target.value)}
        style={{ width: "100%", height: 120 }}
      />

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onloadend = () => {
            console.log("IMAGEM CARREGADA");
            setImg(reader.result);
          };
          reader.readAsDataURL(file);
        }}
      />

      <button onClick={enviar} style={{ marginTop: 10 }}>
        Corrigir
      </button>

      <pre style={{ marginTop: 20 }}>
        {resposta}
      </pre>
    </div>
  );
}
