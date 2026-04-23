export async function POST(req) {
  try {
    const { pergunta, img } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        erro: "Chave Gemini não configurada"
      });
    }

    let parts = [];

    // 👉 sempre envia texto
    parts.push({
      text: pergunta || "Responda: IA funcionando"
    });

    // 👉 só envia imagem se existir
    if (img) {
      const base64 = img.split(",")[1];

      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: base64
        }
      });
    }

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
              parts
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