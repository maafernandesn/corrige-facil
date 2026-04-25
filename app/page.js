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
      if (!img) {
        alert("⚠️ Selecione uma imagem primeiro.");
        return;
      }

      setLoading(true);
      setResultado(null);

      const r = await fetch("/api/corrigir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          img,
          modo,
          // Agora enviamos o gabarito para Tutor e Fast para manter a consistência
          gabaritoOficial: (modo === "fast" || modo === "tutor") ? gabaritoOficial : null
        })
      });

      const data = await r.json();

      if (data.erro) {
        setResultado({ erro: data.erro });
      } else {
        setResultado(data);
        if (modo === "professor" && data.resultado) {
          setGabaritoOficial(data.resultado);
        }
      }
    } catch (e) {
      setResultado({ erro: "Erro na conexão com o servidor ❌" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ textAlign: "center", marginBottom: 30 }}>
        <h1>📸 CorrigeFácil IA</h1>
        <p style={{ color: "#666" }}>Correção sem divergências entre modos</p>
      </header>

      <main style={{ background: "#fff", padding: 25, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 8 }}>Ação:</label>
        <select
          value={modo}
          onChange={(e) => setModo(e.target.value)}
          style={{ width: "100%", padding: 12, marginBottom: 20, borderRadius: 8, border: "1px solid #ddd" }}
        >
          <option value="professor">🧠 1. Gerar Gabarito (Mestre)</option>
          <option value="fast">⚡ 2. Corrigir Prova Aluno (Fast)</option>
          <option value="tutor">👨‍🏫 3. Explicar Erros (Tutor)</option>
        </select>

        <div style={{ marginBottom: 20 }}>
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
                  const maxWidth = 1024; // Aumentamos um pouco a resolução para detalhes fonéticos
                  const scale = maxWidth / imgEl.width;
                  canvas.width = maxWidth;
                  canvas.height = imgEl.height * scale;
                  const ctx = canvas.getContext("2d");
                  ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
                  setImg(canvas.toDataURL("image/jpeg", 0.9));
                };
              };
              reader.readAsDataURL(file);
            }}
          />
        </div>

        <button
          onClick={enviar}
          disabled={loading}
          style={{
            width: "100%", padding: 16, background: loading ? "#ccc" : "#0070f3",
            color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 18, fontWeight: "bold"
          }}
        >
          {loading ? "Processando..." : "Analisar Agora"}
        </button>

        {resultado && (
          <div style={{ marginTop: 30 }}>
            {resultado.erro && <div style={{ color: "red" }}>{resultado.erro}</div>}

            {modo === "professor" && resultado.resultado && (
              <div>
                <h3>✅ Gabarito de Referência Gerado:</h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {Object.entries(resultado.resultado).map(([q, r]) => (
                    <div key={q} style={{ padding: 10, background: "#eef", borderRadius: 5 }}>
                      Q{q}: <strong>{r}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modo === "fast" && resultado.detalhes && (
              <div>
                <div style={{ padding: 20, background: "#0070f3", color: "#fff", borderRadius: 10, textAlign: "center" }}>
                  <h2>Nota: {resultado.nota}</h2>
                  <p>{resultado.acertos} acertos de {resultado.total}</p>
                </div>
                {resultado.detalhes.map((item, i) => (
                  <div key={i} style={{ marginTop: 10, padding: 10, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                    <span>Questão {item.q}</span>
                    <span>Aluno: {item.aluno} | {item.status ? "✅" : `❌ (Certo: ${item.correta})`}</span>
                  </div>
                ))}
              </div>
            )}

            {modo === "tutor" && resultado.resultado && (
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {Object.entries(resultado.resultado).map(([q, info]) => (
                  <div key={q} style={{ padding: 15, background: "#f9f9f9", borderRadius: 8, borderLeft: "4px solid #0070f3" }}>
                    <strong>Questão {q} ({info.res}):</strong>
                    <p style={{ margin: "5px 0 0", color: "#555" }}>📖 {info.exp}</p>
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
