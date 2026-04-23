"use client";

import { useState } from "react";

export default function Home() {
  const [img, setImg] = useState(null);
  const [gabarito, setGabarito] = useState("");
  const [resposta, setResposta] = useState("");

  const enviar = async () => {
    if (!img || !gabarito) {
      alert("Envie a imagem e o gabarito");
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

      setResposta(data.resultado || data.erro || "Sem resposta");

    } catch (e) {
      setResposta("Erro na conexão ❌");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📸 CorrigeFácil</h1>

      <textarea
        placeholder="Ex: 1-C"
        value={gabarito}
        onChange={(e) => setGabarito(e.target.value)}
        style={{ width: "100%", height: 80 }}
      />

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

              const maxWidth = 600;
              const scale = maxWidth / imgEl.width;

              canvas.width = maxWidth;
              canvas.height = imgEl.height * scale;

              const ctx = canvas.getContext("2d");
              ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

              const compressed = canvas.toDataURL("image/jpeg", 0.7);

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