export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    // 🔥 TESTE SEM IMAGEM
    if (!img) {
      const res = await fetch(
        ` https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent? key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: "Responda apenas OK" }]
              }
            ]
          })
        }
      );

      const data = await res.json();

      return Response.json({
        teste: data
      });
    }

    // 🔥 COM IMAGEM
    const base64 = img.split(",")[1];

    const prompt = gabarito
      ? `Analise a imagem de uma prova.

Identifique cada questão e a alternativa marcada.

Compare com o gabarito: ${gabarito}

Responda assim:
Questão 1 - Correta ou Errada
Questão 2 - ...
Nota final: X`
      : `Analise a imagem de uma prova.

Identifique cada questão e qual alternativa foi marcada (A, B, C ou D).

Responda assim:
Questão 1 - Alternativa: X
Questão 2 - Alternativa: X`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent  ?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64
                  }
                }
              ]
            }
          ]
        })
      }
    );

    const data = await res.json();

    console.log("GEMINI:", data);

    const resposta =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resposta) {
      return Response.json({
        erro: "IA não retornou resposta",
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