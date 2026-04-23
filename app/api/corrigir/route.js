export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    const base64 = img.split(",")[1];

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
Você é um corretor de provas.

Analise a imagem enviada:
- Identifique cada questão
- Identifique qual alternativa foi marcada
- Compare com o gabarito: ${gabarito}

Responda no formato:

Questão 1 - Correta ou Errada
Questão 2 - ...
...
Nota final: X
`
                },
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

    const data = await response.json();

    const texto =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sem resposta da IA";

    return Response.json({ resultado: texto });

  } catch (error) {
    return Response.json({
      erro: "Erro na IA",
      detalhe: error.message
    });
  }
}