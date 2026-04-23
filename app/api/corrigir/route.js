export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    const base64 = img.split(",")[1];

    const prompt = gabarito
      ? `
Você é um corretor de provas.

Leia a imagem:
- Identifique cada questão
- Identifique a alternativa marcada
- Compare com o gabarito: ${gabarito}

Responda assim:
Questão 1 - Correta ou Errada
Questão 2 - ...
Nota final: X
`
      : `
Você é um leitor de provas.

Leia a imagem:
- Identifique cada questão
- Identifique a alternativa marcada (A, B, C ou D)

Responda assim:
Questão 1 - Alternativa marcada: X
Questão 2 - Alternativa marcada: X
`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
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

    const resposta =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sem resposta da IA";

    return Response.json({ resultado: resposta });

  } catch (error) {
    return Response.json({
      erro: "Erro na IA",
      detalhe: error.message
    });
  }
}