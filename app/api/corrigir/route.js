export async function POST(req) {
  try {
    const body = await req.json();
    const img = body.img;
    const modo = body.modo || "professor";

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🔥 SEMPRE USA MODO PROFESSOR POR BAIXO
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

    // 🧠 MODO PROFESSOR → retorna tudo
    if (modo === "professor") {
      return Response.json({ resultado: respostaCompleta });
    }

    // ⚡ MODO FAST → extrai só respostas finais
    const respostas = [];

    const regex = /Resposta final:\s*([A-D])/gi;
    let match;

    let contador = 1;

    while ((match = regex.exec(respostaCompleta)) !== null) {
      respostas.push(`${contador} - ${match[1]}`);
      contador++;
    }

    if (respostas.length === 0) {
      return Response.json({
        resultado: "⚠️ Não consegui extrair as respostas."
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