export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

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
      body: `base64Image=${encodeURIComponent(img)}&language=por&OCREngine=2&scale=true`
    });

    // 🔥 VERIFICA STATUS HTTP
    if (!ocrResponse.ok) {
      return Response.json({
        erro: "Erro HTTP no OCR",
        detalhe: ocrResponse.status
      });
    }

    let ocrData;

    try {
      ocrData = await ocrResponse.json();
    } catch {
      return Response.json({
        erro: "OCR retornou resposta inválida"
      });
    }

    console.log("OCR DATA:", ocrData);

    if (!ocrData || ocrData.IsErroredOnProcessing) {
      return Response.json({
        erro: "Erro no OCR",
        detalhe: JSON.stringify(ocrData)
      });
    }

    const texto = ocrData?.ParsedResults?.[0]?.ParsedText;

    if (!texto || texto.trim().length < 5) {
      return Response.json({
        erro: "OCR não conseguiu ler a imagem",
        detalhe: texto
      });
    }

    // 🔥 PROCESSAMENTO SEGURO
    const linhas = texto
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const letras = ["A", "B", "C", "D"];
    let alternativas = [];

    for (const l of linhas) {
      if (/^[A-D]\)/i.test(l) || l.includes("•")) {
        alternativas.push(l);
      }
    }

    if (alternativas.length === 0) {
      return Response.json({
        resultado: "Não encontrei alternativas.\n\nTexto:\n" + texto
      });
    }

    let respostaAluno = null;

    for (let i = 0; i < alternativas.length; i++) {
      const alt = alternativas[i];

      if (
        alt.includes("•") ||
        alt.includes("X") ||
        alt.includes("/") ||
        alt.includes("*")
      ) {
        respostaAluno = letras[i];
        break;
      }
    }

    if (!respostaAluno) {
      return Response.json({
        resultado: "Não consegui identificar a resposta.\n\nTexto:\n" + texto
      });
    }

    if (!gabarito) {
      return Response.json({
        resultado: "Resposta detectada: " + respostaAluno
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
    console.error("ERRO REAL:", error);

    return Response.json({
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}