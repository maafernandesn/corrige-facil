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
          gabaritoOficial: modo === "fast" ? gabaritoOficial : null
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
    <div style={{ padding: 20, maxWidth: 700, margin: "0 auto", fontFamily: "system-ui, sans-serif", color: "#333" }}>
      <header style={{ textAlign: "center", marginBottom: 30 }}>
        <h1 style={{ fontSize: "2rem", marginBottom: 5 }}>📸 CorrigeFácil IA</h1>
        <p style={{ color: "#666" }}>Correção inteligente para professores modernos</p>
      </header>

      <main style={{ background: "#fff", padding: 25, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 8 }}>O que deseja fazer?</label>
        <select
          value={modo}
          onChange={(e) => setModo(e.target.value)}
          style={{ width: "100%", padding: 12, marginBottom: 20, borderRadius: 8, border: "1px solid #ddd", fontSize: 16 }}
        >
          <option value="professor">🧠 Gerar Gabarito (Modo Professor)</option>
          <option value="fast">⚡ Correção Rápida (Modo Fast)</option>
          <option value="tutor">👨‍🏫 Explicar Questões (Modo Tutor)</option>
        </select>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: 8 }}>Foto da Prova</label>
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
                  setImg(canvas.toDataURL("image/jpeg", 0.8)); // Mudei para JPEG comprimido para envio mais rápido
                };
              };
              reader.readAsDataURL(file);
            }}
            style={{ width: "100%" }}
          />
        </div>

        <button
          onClick={enviar}
          disabled={loading}
          style={{
            width: "100%",
            padding: 16,
            background: loading ? "#ccc" : "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 18,
            fontWeight: "bold",
            transition: "0.2s"
          }}
        >
          {loading ? "Analisando com IA..." : "Analisar Prova"}
        </button>

        {resultado && (
          <div style={{ marginTop: 30, paddingTop: 20, borderTop: "2px solid #eee" }}>
            
            {resultado.erro && (
              <div style={{ padding: 15, background: "#fff5f5", color: "#c53030", borderRadius: 8 }}>
                {resultado.erro}
              </div>
            )}

            {modo === "professor" && resultado.resultado && (
              <div>
                <h3 style={{ marginBottom: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  ✅ Gabarito Oficial Identificado:
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
                  {Object.entries(resultado.resultado).map(([q, r]) => (
                    <div key={q} style={{ padding: 12, background: "#f0f7ff", borderRadius: 8, textAlign: "center", border: "1px solid #cce3ff" }}>
                      Questão <strong>{q}</strong>: <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#0070f3" }}>{r}</span>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 15, fontSize: 13, color: "#666" }}>* Este gabarito foi salvo na memória. Agora você pode mudar para a 'Correção Rápida' e enviar as provas dos alunos.</p>
              </div>
            )}

            {modo === "fast" && resultado.detalhes && (
              <div>
                <div style={{ textAlign: "center", marginBottom: 20, padding: 20, background: "#0070f3", color: "#fff", borderRadius: 12, boxShadow: "0 4px 10px rgba(0, 112, 243, 0.3)" }}>
                  <h2 style={{ margin: "0 0 5px 0", fontSize: "2.5rem" }}>Nota: {resultado.nota}</h2>
                  <span style={{ fontSize: "1.1rem", opacity: 0.9 }}>Acertos: {resultado.acertos} de {resultado.total}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {resultado.detalhes.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 15, background: item.status ? "#f0fff4" : "#fff5f5", borderRadius: 10, border: `1px solid ${item.status ? "#c6f6d5" : "#fed7d7"}` }}>
                      <span style={{ fontSize: "1.1rem" }}>Questão <strong>{item.q}</strong></span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span>Aluno: <strong style={{ fontSize: "1.2rem" }}>{item.aluno}</strong></span>
                        <span style={{ fontSize: "1.2rem" }}>{item.status ? "✅" : `❌ (Certa: ${item.correta})`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modo === "tutor" && resultado.resultado && (
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                <h3 style={{ marginBottom: 10 }}>👨‍🏫 Explicações do Tutor:</h3>
                {Object.entries(resultado.resultado).map(([q, info]) => (
                  <div key={q} style={{ padding: 20, background: "#f8f9fa", borderRadius: 12, borderLeft: "5px solid #0070f3", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "1.1rem" }}>Questão {q} (Resposta correta: {info.res})</h4>
                    <p style={{ margin: 0, color: "#444", lineHeight: "1.6", fontSize: "15px", display: "flex", gap: 8 }}>
                      <span>📖</span> {info.exp}
                    </p>
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
