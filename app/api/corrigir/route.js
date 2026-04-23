export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    const prompt = gabarito
      ? `Corrija a prova da imagem.

Identifique cada questão e a alternativa marcada.

Compare com o gabarito: ${gabarito}

Responda assim:
Questão 1 - Correta ou Errada
Nota final: X`
      : `Leia a prova da imagem.

Identifique cada questão e a alternativa marcada.

Responda assim:
Questão 1 - Alternativa: X`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              ...(img
                ? [
                    {
                      type: "image_url",
                      image_url: {
                        url: img
                      }
                    }
                  ]
                : [])
            ]
          }
        ]
      })
    });

    const data = await res.json();

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
      erro: "Erro na IA",
      detalhe: error.message
    });
  }
}