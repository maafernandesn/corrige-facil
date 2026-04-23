export async function POST(req) {
  try {
    const { img } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🔑 OCR grátis
    const OCR_API_KEY = "helloworld";

    // 🔍 OCR com melhorias
    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: OCR_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `base64Image=${encodeURIComponent(img)}&language=por&isOverlayRequired=false&detectOrientation=true&scale=true&OCREngine=2`
    });

    const ocrData = await ocrResponse.json();

    const texto = ocrData?.ParsedResults?.[0]?.ParsedText;

    console.log("TEXTO OCR:", texto);

    if (!texto || texto.trim().length < 10) {
      return Response.json({
        erro: "Não foi possível ler o texto da imagem. Tente tirar uma foto mais clara."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        erro: "Chave Gemini não configurada"
      });
    }

    // 🤖 IA (apenas texto)
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
Você é um professor.

Corrija a prova abaixo:

${texto}

Faça:
- Liste as questões
- Diga o que está certo e errado
- Dê nota de 0 a 10
- Explique erros
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
    console.error(error);

    return Response.json({
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}