export async function POST(req) {
  try {
    const { img, pergunta } = await req.json();

    if (!img) {
      return Response.json({
        erro: "Imagem não enviada"
      });
    }

    const base64 = img.split(",")[1];

    const response = await fetch(
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
                {
                  text: pergunta || "Corrija esta prova e dê a nota"
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
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

    return Response.json({
      resultado:
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sem resposta da IA"
    });

  } catch (error) {
    return Response.json({
      erro: "Erro com Gemini",
      detalhe: error.message
    });
  }
}