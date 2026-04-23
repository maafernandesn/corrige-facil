export async function POST(req) {
  try {
    const { img } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🔑 OCR API KEY (grátis)
    const OCR_API_KEY = "helloworld";

    // 🔄 enviar imagem para OCR
    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: OCR_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `base64Image=${encodeURIComponent(img)}&language=por`
    });

    const ocrData = await ocrResponse.json();

    const texto = ocrData?.ParsedResults?.[0]?.ParsedText;

    if (!texto) {
      return Response.json({
        erro: "Não foi possível ler o texto da imagem"
      });
    }

    // 🤖 IA (Gemini texto)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
Corrija essa prova:

${texto}

- Diga o que está certo/errado
- Dê nota de 0 a 10
- Explique os erros
`
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
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}