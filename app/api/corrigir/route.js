export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // OCR (SEM cortar imagem)
    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: "helloworld",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `base64Image=${encodeURIComponent(img)}&language=por&OCREngine=2&scale=true&detectOrientation=true`
    });

    const ocrData = await ocrResponse.json();

    console.log("OCR:", ocrData);

    if (!ocrData || ocrData.IsErroredOnProcessing) {
      return Response.json({
        erro: "Erro no OCR",
        detalhe: JSON.stringify(ocrData)
      });
    }

    const texto = ocrData.ParsedResults?.[0]?.ParsedText;

    if (!texto || texto.trim().length < 5) {
      return Response.json({
        erro: "OCR não conseguiu ler a imagem",
        detalhe: texto
      });
    }

    const linhas = texto
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const letras = ["A", "B", "C", "D"];
    let alternativas = [];

    // pegar alternativas
    linhas.forEach(l => {
      if (/^[A-D]\)/i.test(l) || l.includes("•")) {
        alternativas.push(l);
      }
    });

    console.log("ALTERNATIVAS:", alternativas);

    let respostaAluno = null;

    alternativas.forEach((alt, i) => {
      if (
        alt.includes("•") ||
        alt.includes("X") ||
        alt.includes("/") ||
        alt.includes("*")
      ) {
        respostaAluno = letras[i];
      }
    });

    if (!respostaAluno) {
      return Response.json({
        resultado: `⚠️ Não consegui identificar a resposta marcada.\n\nTexto:\n${texto}`
      });
    }

    if (!gabarito) {
      return Response.json({
        resultado: `Resposta detectada: ${respostaAluno}`
      });
    }

    const [q, correta] = gabarito.split("-");

    let resultado = "📄 Correção\n\n";

    if (respostaAluno === correta.trim().toUpperCase()) {
      resultado += `Questão ${q} - Correta ✅\n🎯 Nota: 10`;
    } else {
      resultado += `Questão ${q} - Errada ❌ (${respostaAluno})\n🎯 Nota: 0`;
    }

    return Response.json({ resultado });

  } catch (error) {
    console.error("ERRO:", error);

    return Response.json({
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}