export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    const base64 = img ? img.split(",")[1] : null;

    const prompt = gabarito
      ? `Você é um corretor de provas.

Analise a imagem:
- Identifique cada questão
- Identifique a alternativa marcada
- Compare com o gabarito: ${gabarito}

Responda assim:
Questão 1 - Correta ou Errada
Questão 2 - ...
Nota final: X`
      : `Você é um leitor de provas.

Analise a imagem:
- Identifique cada questão
- Identifique a alternativa marcada (A, B, C ou D)

Responda assim:
Questão 1 - Alternativa: X
Questão 2 - Alternativa: X`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
                ...(base64
                  ? [
                      {
                        inlineData: {
                          mimeType: "image/jpeg",
                          data: base64
                        }
                      }
                    ]
                  : [])
              ]
            }
          ]
        })
      }
    );

    const data = await res.json();

    console.log("GEMINI RESPONSE:", data);

    const resposta =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

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