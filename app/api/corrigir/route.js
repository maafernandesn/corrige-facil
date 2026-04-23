export async function POST(req) {
  try {
    const { img, pergunta } = await req.json();

    if (!img) {
      return Response.json({
        erro: "Imagem não enviada"
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        erro: "Chave Gemini não configurada"
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

    console.log("RESPOSTA GEMINI:", JSON.stringify(data, null, 2));

    // 🔥 tenta extrair resposta de forma segura
    let texto = "Sem resposta da IA";

    if (data.candidates && data.candidates.length > 0) {
      const parts = data.candidates[0].content?.parts;

      if (parts && parts.length > 0) {
        texto = parts.map(p => p.text || "").join("\n");
      }
    }

    return Response.json({
      resultado: texto
    });

  } catch (error) {
    return Response.json({
      erro: "Erro com Gemini",
      detalhe: error.message
    });
  }
}