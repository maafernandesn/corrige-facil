export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({
        erro: "Imagem não enviada"
      });
    }

    const prompt = gabarito
      ? `Você é um corretor de provas.

Analise a imagem:
- Identifique cada questão numerada
- Identifique a alternativa marcada (A, B, C ou D)
- Compare com o gabarito: ${gabarito}

Responda EXATAMENTE assim:

📄 Correção

Questão 1 - Correta ou Errada
Questão 2 - Correta ou Errada
Questão 3 - Correta ou Errada

🎯 Nota final: X`
      : `Você é um leitor de provas.

Analise a imagem:
- Identifique cada questão numerada
- Identifique a alternativa marcada (A, B, C ou D)

Responda assim:

Questão 1 - Alternativa: X
Questão 2 - Alternativa: X`;

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
                image_url: {
                  url: img
                }
              }
            ]
          }
        ]
      })
    });

    const data = await res.json();

    // 🔥 tratamento de erro real da API
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

    return Response.json({
      resultado: resposta
    });

  } catch (error) {
    return Response.json({
      erro: "Erro no servidor",
      detalhe: error.message
    });
  }
}