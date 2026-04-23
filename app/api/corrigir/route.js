export async function POST(req) {
  try {
    const { pergunta } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        erro: "Chave Gemini não configurada"
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
                  text: pergunta || "Responda apenas OK"
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    console.log("GEMINI:", data);

    return Response.json({
      resultado:
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        JSON.stringify(data)
    });

  } catch (error) {
    return Response.json({
      erro: "Erro Gemini",
      detalhe: error.message
    });
  }
}