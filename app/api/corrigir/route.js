export async function POST(req) {
  try {
    const { img } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🔍 OCR
    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: "helloworld",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `base64Image=${encodeURIComponent(img)}&language=por&detectOrientation=true&scale=true&OCREngine=2`
    });

    const ocrData = await ocrResponse.json();
    const texto = ocrData?.ParsedResults?.[0]?.ParsedText;

    if (!texto || texto.trim().length < 10) {
      return Response.json({
        erro: "Não foi possível ler a imagem"
      });
    }

    console.log("TEXTO OCR:", texto);

    // 🤖 IA HuggingFace
    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-large",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `
Corrija esta prova:

${texto}

- diga o que está certo e errado
- dê nota de 0 a 10
- explique erros
`
        })
      }
    );

    const hfData = await hfResponse.json();

    return Response.json({
      resultado: hfData?.[0]?.generated_text || "Sem resposta da IA"
    });

  } catch (error) {
    return Response.json({
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}