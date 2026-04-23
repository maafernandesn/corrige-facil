"use client";

import { useState } from "react";

export default function Home() {
  const [img, setImg] = useState(null);
  const [gabarito, setGabarito] = useState("");
  const [resposta, setResposta] = useState("");

  const enviar = async () => {
    console.log("clicou no botão");

    if (!gabarito) {
      alert("Digite o gabarito");
      return;
    }

    try {
      setResposta("Testando API... ⏳");

      const baseUrl = window.location.origin;

      const r = await fetch(`${baseUrl}/api/corrigir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          img: img || "teste",
          gabarito
        })
      });

      const data = await r.json();

      console.log("RESPOSTA API:", data);

      setResposta(
        data.resultado ||
        data.erro ||
        data.detalhe ||
        "Sem resposta da API"
      );

    } catch (err) {
      console.error("ERRO FETCH:", err);
      setResposta("Erro na conexão ❌");
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>📸 CorrigeFácil</h1>

      <textarea
        placeholder="Digite o gabarito aqui..."
        value={gabarito}
        onChange={(e) => setGabarito(e.target.value)}
        style={{
          width: "100%",
          height: 120,
          marginBottom: 10,
          padding: 10
        }}
      />

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onloadend = () => {
            console.log("imagem carregada");
            setImg(reader.result);
          };
          reader.readAsDataURL(file);
        }}
        style={{ marginBottom: 10 }}
      />

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
        Corrigir
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
