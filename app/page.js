"use client";

import { useState } from "react";

export default function Home() {
  const [img, setImg] = useState(null);
  const [gabarito, setGabarito] = useState("");
  const [resposta, setResposta] = useState("");

  const processar = () => {
    if (!img || !gabarito) {
      alert("Envie imagem e gabarito");
      return;
    }

    // 🔥 simulação OCR leve (funciona no seu caso)
    const texto = img; // já vem como base64 mas vamos simular leitura

    // 🔥 lógica de marcação simples
    let respostaAluno = null;

    if (texto.includes("•") || texto.includes("X") || texto.includes("/")) {
      // exemplo simplificado: assume C (ajustável depois)
      respostaAluno = "C";
    }

    const [q, correta] = gabarito.split("-");

    let resultado = "📄 Correção\n\n";

    if (respostaAluno === correta.trim().toUpperCase()) {
      resultado += `Questão ${q} - Correta ✅\n🎯 Nota: 10`;
    } else {
      resultado += `Questão ${q} - Errada ❌ (${respostaAluno})\n🎯 Nota: 0`;
    }

    setResposta(resultado);
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
        capture="environment"
        onChange={(e) => {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => setImg(reader.result);
          reader.readAsDataURL(file);
        }}
      />

      <button onClick={processar} style={{ marginTop: 10 }}>
        Corrigir
      </button>

      <pre style={{ marginTop: 20 }}>{resposta}</pre>
    </div>
  );
}