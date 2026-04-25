"use client";

import { useState } from "react";

export default function Home() {
  const [img, setImg] = useState(null);
  const [modo, setModo] = useState("professor");
  const [gabaritoOficial, setGabaritoOficial] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  const enviar = async () => {
    try {
      if (!img) return alert("⚠️ Selecione uma imagem.");
      setLoading(true);
      setResultado(null);

      const r = await fetch("/api/corrigir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          img,
          modo,
          gabaritoOficial: (modo === "fast" || modo === "tutor") ? gabaritoOficial : null
        })
      });

      const data = await r.json();
      if (data.erro) {
        setResultado({ erro: data.erro });
      } else {
        setResultado(data);
        if (modo === "professor") setGabaritoOficial(data.resultado);
      }
    } catch (e) {
      setResultado({ erro: "Erro de conexão ❌" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto", fontFamily: "sans-serif" }}>
      <header style={{ textAlign: "center" }}>
        <h1>🚀 CorrigeFácil IA 2.0</h1>
        <p>Gerador de Gabarito e Corretor Visual</p>
      </header>

      <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <select 
          value={modo} 
          onChange={(e) => setModo(e.target.value)}
          style={{ width: "100%", padding: 12, marginBottom: 15, borderRadius: 8 }}
        >
          <option value="professor">🧠 1. Criar Gabarito (Resolve a Prova)</option>
          <option value="fast">⚡ 2. Corrigir Aluno (Detecta 'Em Branco')</option>
          <option value="tutor">👨‍🏫 3. Explicar com Tutor</option>
        </select>

        <input type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const imgEl = new Image();
            imgEl.src = ev.target.result;
            imgEl.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = 1024;
              const scale = 1024 / imgEl.width;
              canvas.height = imgEl.height * scale;
              canvas.getContext("2d").drawImage(imgEl, 0, 0, canvas.width, canvas.height);
              setImg(canvas.toDataURL("image/jpeg", 0.9));
            };
          };
          reader.readAsDataURL(file);
        }} style={{ marginBottom: 15 }} />

        <button 
          onClick={enviar} 
          disabled={loading}
          style={{ width: "100%", padding: 15, background: "#0070f3", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
        >
          {loading ? "Processando..." : "Analisar Imagem"}
        </button>

        {resultado && (
          <div style={{ marginTop: 20 }}>
            {resultado.nota && (
              <div style={{ textAlign: "center", padding: 15, background: "#0070f3", color: "#fff", borderRadius: 8, marginBottom: 15 }}>
                <h2 style={{ margin: 0 }}>Nota Final: {resultado.nota}</h2>
              </div>
            )}

            {resultado.detalhes ? (
              resultado.detalhes.map((d, i) => (
                <div key={i} style={{ padding: 10, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", background: d.aluno === "EM BRANCO" ? "#fff3cd" : "transparent" }}>
                  <span>Q{d.q}</span>
                  <span>
                    {d.aluno === "EM BRANCO" ? (
                      <strong style={{ color: "#856404" }}>⚠️ NÃO RESPONDIDA</strong>
                    ) : (
                      <>Aluno: <strong>{d.aluno}</strong> | {d.status ? "✅" : `❌ (Certa: ${d.correta})`}</>
                    )}
                  </span>
                </div>
              ))
            ) : resultado.resultado && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {Object.entries(resultado.resultado).map(([q, v]) => (
                  <div key={q} style={{ padding: 10, background: "#f0f4f8", borderRadius: 6 }}>
                    <strong>Q{q}:</strong> {typeof v === 'string' ? v : `${v.res} - 📖 ${v.exp}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
