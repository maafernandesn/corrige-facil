"use client";

import { useState } from "react";

export default function Home() {
  const [img, setImg] = useState(null);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");

  const enviar = async () => {
    if (!img) {
      alert("Envie uma imagem");
      return;
    }

    try {
      setResposta("Analisando... ⏳");

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
      <h1>📸 CorrigeFácil IA (Grátis)</h1>

      <textarea
        placeholder="Ex: Corrija a prova e dê a nota"
        value={pergunta}
        onChange={(e) => setPergunta(e.target.value)}
        style={{ width: "100%", height: 80, marginBottom: 10 }}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;

          const imgEl = new Image();
          const reader = new FileReader();

          reader.onload = (event) => {
            imgEl.src = event.target.result;
          };

          imgEl.onload = () => {
            const canvas = document.createElement("canvas");

            const maxWidth = 600;
            const scale = maxWidth / imgEl.width;

            canvas.width = maxWidth;
            canvas.height = imgEl.height * scale;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

            const compressed = canvas.toDataURL("image/jpeg", 0.6);

            setImg(compressed);
          };

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