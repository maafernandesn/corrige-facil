"use client";

import { useState } from "react";

export default function Home() {
  const [img, setImg] = useState(null);
  const [modo, setModo] = useState("professor");
  const [gabaritoOficial, setGabaritoOficial] = useState(null); // Salva o que o professor gerou
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
          // Se for modo fast e tivermos um gabarito salvo, enviamos ele
          gabaritoOficial: modo === "fast" ? gabaritoOficial : null
        })
      });

      const data = await r.json();

      if (data.erro) {
        setResultado({ erro: data.erro });
      } else {
        setResultado(data);
        
        // Se geramos um gabarito no modo professor, salvamos para o próximo uso
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
        
        {/* 🔽 SELEÇÃO DE MODO */}
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

        {/* 📷 INPUT DE IMAGEM */}
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
                  setImg(canvas.toDataURL("image/png"));
                };
              };
              reader.readAsDataURL(file);
            }}
            style={{ width: "100%" }}
          />
        </div>

        {/* 🚀 BOTÃO DE AÇÃO */}
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
          {loading ? "Processando com IA..." : "Analisar Prova"}
        </button>

        {/* 📊 ÁREA DE RESULTADOS */}
        {resultado && (
          <div style={{ marginTop: 30, paddingTop: 20, borderTop: "2px solid #eee" }}>
            
            {resultado.erro && (
              <div style={{ padding: 15, background: "#fff5f5", color: "#c53030", borderRadius: 8 }}>
                {resultado.erro}
              </div>
            )}

            {/* Layout para Modo Professor */}
            {modo === "professor" && resultado.resultado && (
              <div>
                <h3 style={{ marginBottom: 10 }}>✅ Gabarito Identificado:</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 10 }}>
                  {Object.entries(resultado.resultado).map(([q, r]) => (
                    <div key={q} style={{ padding: 10, background: "#f0f7ff", borderRadius: 6, textAlign: "center" }}>
                      <strong>{q}:</strong> {r}
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 15, fontSize: 13, color: "#666" }}>* Este gabarito foi salvo para correções rápidas.</p>
              </div>
            )}

            {/* Layout para Modo Fast */}
            {modo === "fast" && resultado.detalhes && (
              <div>
                <div style={{ textAlign: "center", marginBottom: 20, padding: 15, background: "#0070f3", color: "#fff", borderRadius: 10 }}>
                  <h2 style={{ margin: 0 }}>Nota: {resultado.nota}</h2>
                  <span>Acertos: {resultado.acertos} de {resultado.total}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {resultado.detalhes.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: 12, background: item.status ? "#f0fff4" : "#fff5f5", borderRadius: 8, border: `1px solid ${item.status ? "#c6f6d5" : "#fed7d7"}` }}>
                      <span>Questão <strong>{item.q}</strong></span>
                      <span>Aluno: <strong>{item.aluno}</strong> {item.status ? "✅" : `❌ (Certa: ${item.correta})`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Layout para Modo Tutor */}
            {modo === "tutor" && resultado.resultado && (
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                <h3>👨‍🏫 Explicações do Tutor:</h3>
                {Object.entries(resultado.resultado).map(([q, info]) => (
                  <div key={q} style={{ padding: 15, background: "#f9f9f9", borderRadius: 10, borderLeft: "4px solid #0070f3" }}>
                    <strong>Questão {q} (Resposta {info.res}):</strong>
                    <p style={{ margin: "5px 0 0", color: "#555" }}>{info.exp}</p>
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
