"use client";

import { useState } from "react";

export default function Home() {
  const [img, setImg] = useState(null);
  const [resposta, setResposta] = useState("");

  const enviar = async () => {
    if (!img) {
      alert("Envie uma imagem");
      return;
    }

    try {
      setResposta("Lendo imagem... ⏳");

      const baseUrl = window.location.origin;

      const r = await fetch(`${baseUrl}/api/corrigir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ img })
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
      <h1>📸 CorrigeFácil OCR</h1>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();

          reader.onload = (event) => {
            const imgEl = new Image();
            imgEl.src = event.target.result;

            imgEl.onload = () => {
              const canvas = document.createElement("canvas");

              // 🔥 compressão forte (evita erro)
              const maxWidth = 500;
              const scale = maxWidth / imgEl.width;

              canvas.width = maxWidth;
              canvas.height = imgEl.height * scale;

              const ctx = canvas.getContext("2d");
              ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

              const compressed = canvas.toDataURL("image/jpeg", 0.6);

              setImg(compressed);
            };
          };

          reader.readAsDataURL(file);
        }}
      />

      <button onClick={enviar} style={{ marginTop: 10 }}>
        Corrigir
      </button>

      <pre style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>
        {resposta}
      </pre>
    </div>
  );
}