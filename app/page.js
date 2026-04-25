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
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto", fontFamily: "sans-serif", color: "#333" }}>
      <header style={{ textAlign: "center", marginBottom: 30 }}>
        <h1>📸 CorrigeFácil Pro</h1>
        <p>Gabarito Automático e Correção Visual</p>
      </header>

      <main style={{ background: "#fff", padding: 25, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <select value={modo} onChange={(e) => setModo(e.target.value)}
          style={{ width: "100%", padding: 12, marginBottom: 20, borderRadius: 8, fontSize: 16 }}>
          <option value="professor">🧠 1. Gerar Gabarito (Mestre)</option>
          <option value="fast">⚡ 2. Corrigir Prova Aluno (Fast)</option>
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
              canvas.width = 1200; // Resolução maior para detectar detalhes de marcas de lápis
              const scale = 1200 / imgEl.width;
              canvas.height = imgEl.height * scale;
              canvas.getContext("2d").drawImage(imgEl, 0, 0, canvas.width, canvas.height);
              setImg(canvas.toDataURL("image/jpeg", 0.9));
            };
          };
          reader.readAsDataURL(file);
        }} style={{ marginBottom: 20 }} />

        <button onClick={enviar} disabled={loading}
          style={{ width: "100%", padding: 15, background: "#0070f3", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 18 }}>
          {loading ? "Analisando..." : "Analisar Prova"}
        </button>

        {resultado && (
          <div style={{ marginTop: 30, borderTop: "2px solid #eee", paddingTop: 20 }}>
            {resultado.nota && (
              <div style={{ textAlign: "center", padding: 15, background: "#0070f3", color: "#fff", borderRadius: 10, marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>Nota: {resultado.nota}</h2>
                <span>{resultado.acertos} acertos de {resultado.total}</span>
              </div>
            )}

            {resultado.detalhes ? (
              resultado.detalhes.map((d, i) => (
                <div key={i} style={{ padding: 15, marginBottom: 10, borderRadius: 8, border: "1px solid #ddd", background: d.aluno === "EM BRANCO" ? "#fff9db" : d.status ? "#ebfbee" : "#fff5f5", display: "flex", justifyContent: "space-between" }}>
                  <span>Questão <strong>{d.q}</strong></span>
                  <span>
                    {d.aluno === "EM BRANCO" ? (
                      <span style={{ color: "#856404", fontWeight: "bold" }}>⚠️ EM BRANCO</span>
                    ) : (
                      <>Marcou: <strong>{d.aluno}</strong> | {d.status ? "✅" : `❌ (Certa: ${d.correta})`}</>
                    )}
                  </span>
                </div>
              ))
            ) : resultado.resultado && (
              <div style={{ display: "grid", gap: 15 }}>
                {Object.entries(resultado.resultado).map(([q, v]) => (
                  <div key={q} style={{ padding: 15, background: "#f8f9fa", borderRadius: 8, borderLeft: "5px solid #0070f3" }}>
                    <strong>Questão {q}:</strong> {typeof v === 'string' ? `Resposta ${v}` : `${v.res} - 📖 ${v.exp}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
