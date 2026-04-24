export async function POST(req) {
  try {
    const body = await req.json();
    const img = body.img;
    const modo = body.modo || "professor";

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🧠 MODO PROFESSOR
    const promptProfessor = `
Analise a imagem com perguntas de múltipla escolha.

Para cada pergunta:
- leia o enunciado
- analise cada alternativa
- explique qual está correta e por quê

Formato:

Questão 1:
A) errado - motivo
B) errado - motivo
C) correto - motivo
D) errado - motivo

Resposta final: X

Repita para todas as questões.
`;

    // ⚡ MODO RÁPIDO (SEM BLOQUEIO)
    const promptRapido = `
Leia a imagem contendo perguntas com alternativas.

Para cada pergunta:
- identifique o número
- indique a alternativa correta (A, B, C ou D)

Responda apenas assim:

1 - A
2 - B
3 - C

Não explique.
Não pule perguntas.
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
        model: "openai/gpt-4o-mini", // 🔥 mais estável pra esse caso
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