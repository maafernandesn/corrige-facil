export async function POST(req) {
  try {
    const { img, pergunta } = await req.json();

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=SUA_CHAVE",
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
                  text: pergunta || "Corrija a prova e dê a nota"
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: img.split(",")[1]
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
      resultado: data.candidates?.[0]?.content?.parts?.[0]?.text
    });

  } catch (error) {
    return Response.json({
      erro: "Erro com Gemini",
      detalhe: error.message
    });
  }
}