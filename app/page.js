"use client";

import { useState } from "react";

export default function Home() {
  const [imgs, setImgs] = useState([]);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");

  const enviar = async () => {
    if (!imgs.length) {
      alert("Envie pelo menos uma imagem");
      return;
    }

    try {
      setResposta("Analisando imagens... ⏳");

      const baseUrl = window.location.origin;

      const r = await fetch(`${baseUrl}/api/corrigir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ imgs, pergunta })
      });

      const data = await r.json();

      setResposta(
        data.resultado ||
        data.erro ||
        data.detalhe ||
        "Sem resposta"
      );

    } catch (err) {
      console.error("ERRO REAL:", err);
      setResposta("Erro na conexão ❌");
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>📸 CorrigeFácil IA</h1>

      <textarea
        placeholder="Ex: Corrija as provas e dê a nota"
        value={pergunta}
        onChange={(e) => setPergunta(e.target.value)}
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
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files);

          files.forEach(file => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (event) => {
              img.src = event.target.result;
            };

            img.onload = () => {
              const canvas = document.createElement("canvas");

              const maxWidth = 800;
              const scale = maxWidth / img.width;

              canvas.width = maxWidth;
              canvas.height = img.height * scale;

              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              const compressed = canvas.toDataURL("image/jpeg", 0.7);

              setImgs(prev => [...prev, compressed]);
            };

            reader.readAsDataURL(file);
          });
        }}
        style={{ marginBottom: 10 }}
      />

      <p>{imgs.length} imagem(ns) selecionada(s)</p>

      <button
        onClick={enviar}
        style={{
          width: "100%",
          padding: 15,
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 10,
          fontSize: 16
        }}
      >
        Enviar
      </button>

      <pre
        style={{
          marginTop: 20,
          background: "#f3f3f3",
          padding: 10,
          borderRadius: 10,
          whiteSpace: "pre-wrap"
        }}
      >
        {resposta}
      </pre>
    </div>
  );
}