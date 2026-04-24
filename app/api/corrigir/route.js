export async function POST(req) {
  try {
    const body = await req.json();
    const img = body.img;
    const modo = body.modo || "professor";

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🧠 MODO PROFESSOR (com explicação)
    const promptProfessor = `
Analise a imagem de uma questão de múltipla escolha.

Siga os passos:
1. Leia o enunciado
2. Analise cada alternativa
3. Explique por que está certa ou errada
4. Escolha a correta

Formato:

Questão 1:
A) errado - motivo
B) errado - motivo
C) correto - motivo
D) errado - motivo

Resposta final: X
`;

    // ⚡ MODO RÁPIDO (resposta direta)
    const promptRapido = `
Leia a questão da imagem e responda apenas:

Questão 1 - Resposta correta: X
`;

    const prompt = modo === "professor" ? promptProfessor : promptRapido;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://seu-app.vercel.app",
        "X-Title": "CorrigeFacilIA"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: img }
              }
            ]
          }
        ]
      })
    });

    const data = await res.json();

    // 🔥 tratamento de erro da API
    if (data.error) {
      return Response.json({
        erro: "Erro da API",
        detalhe: data.error.message || JSON.stringify(data.error)
      });
    }

    const resposta = data?.choices?.[0]?.message?.content;

    if (!resposta) {
      return Response.json({
        erro: "IA não respondeu",
        detalhe: JSON.stringify(data)
      });
    }

    return Response.json({ resultado: resposta });

  } catch (error) {
    return Response.json({
      erro: "Erro no servidor",
      detalhe: error.message
    });
  }
}