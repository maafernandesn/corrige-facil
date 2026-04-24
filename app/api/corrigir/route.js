export async function POST(req) {
  try {
    const body = await req.json();
    const img = body.img;
    const modo = body.modo || "professor";

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🧠 SEMPRE USA MODO PROFESSOR (MAIS PRECISO)
    const prompt = `
Analise as perguntas da imagem.

Para cada pergunta:
1. Leia o enunciado
2. Analise cada alternativa
3. Explique qual está correta

Formato:

Questão 1:
A) errado - motivo
B) errado - motivo
C) correto - motivo
D) errado - motivo

Resposta final: X

Repita para todas as questões.
`;

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

    const respostaCompleta = data?.choices?.[0]?.message?.content;

    if (!respostaCompleta) {
      return Response.json({
        erro: "IA não respondeu",
        detalhe: JSON.stringify(data)
      });
    }

    // 🧠 MODO PROFESSOR → retorna completo
    if (modo === "professor") {
      return Response.json({ resultado: respostaCompleta });
    }

    // ⚡ MODO FAST → extrai respostas finais (ROBUSTO)
    const respostas = [];

    const matches = respostaCompleta.matchAll(/Resposta\s*final\s*:\s*([A-D])/gi);

    let contador = 1;

    for (const m of matches) {
      respostas.push(`${contador} - ${m[1].toUpperCase()}`);
      contador++;
    }

    // 🔥 fallback se não encontrar nada
    if (respostas.length === 0) {
      return Response.json({
        resultado: "⚠️ Não consegui extrair as respostas automaticamente."
      });
    }

    return Response.json({
      resultado: respostas.join("\n")
    });

  } catch (error) {
    return Response.json({
      erro: "Erro no servidor",
      detalhe: error.message
    });
  }
}