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
Analise as perguntas da imagem.

Para cada pergunta:
- analise cada alternativa
- explique qual está correta

Formato:

Questão 1:
A) errado - motivo
B) errado - motivo
C) correto - motivo
D) errado - motivo

Resposta final: X
`;

    // ⚡ MODO FAST (FORÇADO)
    const promptRapido = `
Leia TODAS as perguntas da imagem.

Para cada pergunta:
- escolha a alternativa mais correta (A, B, C ou D)

IMPORTANTE:
- NÃO diga que não pode responder
- NÃO diga que não tem certeza
- escolha sempre a melhor alternativa possível
- responda TODAS as perguntas

Formato:

1 - A
2 - B
3 - C
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
        model: "openai/gpt-4o-mini",
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

    let resposta = data?.choices?.[0]?.message?.content;

    if (!resposta) {
      return Response.json({
        erro: "IA não respondeu",
        detalhe: JSON.stringify(data)
      });
    }

    // 🔥 TRAVA ANTI-RESPOSTA FRACA
    if (
      resposta.toLowerCase().includes("não posso") ||
      resposta.toLowerCase().includes("não tenho certeza")
    ) {
      resposta = "⚠️ Não consegui interpretar todas as questões. Tente uma imagem mais nítida.";
    }

    return Response.json({ resultado: resposta });

  } catch (error) {
    return Response.json({
      erro: "Erro no servidor",
      detalhe: error.message
    });
  }
}