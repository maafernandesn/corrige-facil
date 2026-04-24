"use client";

import { useState } from "react";

export default function Home() {
  const [img, setImg] = useState(null);
  const [modo, setModo] = useState("professor");
  const [respostasAluno, setRespostasAluno] = useState("");
  const [resposta, setResposta] = useState("");

  const enviar = async () => {
    try {
      if (!img) {
        setResposta("⚠️ Envie uma imagem primeiro.");
        return;
      }

      setResposta("Processando... ⏳");

      const r = await fetch("/api/corrigir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          img,
          modo,
          respostasAluno
        })
      });

      const data = await r.json();

      setResposta(data.resultado || data.erro || "Sem resposta");

    } catch (e) {
      setResposta("Erro na conexão ❌");
    }
  };

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 600,
        margin: "0 auto",
        fontFamily: "Arial"
      }}
    >
      <h1 style={{ textAlign: "center" }}>📸 CorrigeFácil IA</h1>

      {/* 🔽 SELETOR DE MODO */}
      <select
        value={modo}
        onChange={(e) => setModo(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 10,
          borderRadius: 6
        }}
      >
        <option value="professor">🧠 Modo Professor (explicação)</option>
        <option value="fast">⚡ Correção Rápida</option>
      </select>

      {/* 📝 RESPOSTAS DO ALUNO */}
      <textarea
        placeholder="Respostas do aluno (ex: 2-B,3-D,4-A)"
        value={respostasAluno}
        onChange={(e) => setRespostasAluno(e.target.value)}
        style={{
          width: "100%",
          height: 70,
          marginBottom: 10,
          padding: 10,
          borderRadius: 6,
          border: "1px solid #ccc"
        }}
      />

      {/* 📷 INPUT DE IMAGEM */}
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

              // 🔥 PNG (melhor leitura da IA)
              const compressed = canvas.toDataURL("image/png");

              setImg(compressed);
            };
          };

          reader.readAsDataURL(file);
        }}
        style={{ marginBottom: 10 }}
      />

      {/* 🚀 BOTÃO */}
      <button
        onClick={enviar}
        style={{
          width: "100%",
          padding: 14,
          background: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 16,
          fontWeight: "bold"
        }}
      >
        Corrigir
      </button>

      {/* 📊 RESULTADO */}
      <div
        style={{
          marginTop: 20,
          padding: 15,
          background: "#f9f9f9",
          borderRadius: 10,
          border: "1px solid #ddd",
          whiteSpace: "pre-wrap",
          minHeight: 120
        }}
      >
        {resposta}
      </div>
    </div>
  );
}