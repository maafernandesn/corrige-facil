"use client";

import { useState } from "react";

export default function Home() {
  const [img, setImg] = useState(null);
  const [gabarito, setGabarito] = useState("");
  const [resposta, setResposta] = useState("");

  const enviar = async () => {
    try {
      setResposta("Processando... ⏳");

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
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>📸 CorrigeFácil IA</h1>

      <textarea
        placeholder="Gabarito (opcional) Ex: 1-A,2-C,3-D"
        value={gabarito}
        onChange={(e) => setGabarito(e.target.value)}
        style={{
          width: "100%",
          height: 80,
          marginBottom: 10,
          padding: 10
        }}
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

              const maxWidth = 1000;
              const scale = maxWidth / imgEl.width;

              canvas.width = maxWidth;
              canvas.height = imgEl.height * scale;

              const ctx = canvas.getContext("2d");
              ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

              // 🔥 MENOS COMPRESSÃO = MELHOR LEITURA
              const compressed = canvas.toDataURL("image/jpeg", 1.0);

              setImg(compressed);
            };
          };

          reader.readAsDataURL(file);
        }}
        style={{ marginBottom: 10 }}
      />

      <button
        onClick={enviar}
        style={{
          width: "100%",
          padding: 12,
          background: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 16
        }}
      >
        Corrigir
      </button>

      <div
        style={{
          marginTop: 20,
          padding: 15,
          background: "#f5f5f5",
          borderRadius: 8,
          whiteSpace: "pre-wrap",
          minHeight: 100
        }}
      >
        {resposta}
      </div>
    </div>
  );
}