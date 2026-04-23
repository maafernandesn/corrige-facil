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
      body: `base64Image=${encodeURIComponent(img)}&language=por&OCREngine=2`
    });

    let ocrData;

    try {
      ocrData = await ocrResponse.json();
    } catch {
      return Response.json({
        erro: "Erro ao ler resposta do OCR"
      });
    }

    if (!ocrData || ocrData.IsErroredOnProcessing) {
      return Response.json({
        erro: "Erro no OCR",
        detalhe: JSON.stringify(ocrData)
      });
    }

    const texto = ocrData?.ParsedResults?.[0]?.ParsedText;

    if (!texto || texto.trim().length < 3) {
      return Response.json({
        erro: "OCR não conseguiu ler a imagem"
      });
    }

    console.log("TEXTO OCR:", texto);

    const linhas = texto
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const letras = ["A", "B", "C", "D"];
    let alternativas = [];

    // 🔥 pegar possíveis alternativas
    for (const l of linhas) {
      if (
        /^[A-D]\)/i.test(l) ||
        l.includes("*") ||
        l.includes("•") ||
        l.includes("X") ||
        l.includes("/")
      ) {
        alternativas.push(l);
      }
    }

    console.log("ALTERNATIVAS:", alternativas);

    if (alternativas.length === 0) {
      return Response.json({
        resultado: "Não encontrei alternativas.\n\n" + texto
      });
    }

    let respostaAluno = null;

    // 🔥 detectar marcação pela posição
    for (let i = 0; i < alternativas.length; i++) {
      const alt = alternativas[i];

      if (
        alt.includes("*") ||
        alt.includes("•") ||
        alt.includes("X") ||
        alt.includes("/")
      ) {
        respostaAluno = letras[i] || null;
        break;
      }
    }

    if (!respostaAluno) {
      return Response.json({
        resultado: "Não consegui identificar a resposta.\n\n" + texto
      });
    }

    if (!gabarito) {
      return Response.json({
        resultado: "Resposta detectada: " + respostaAluno
      });
    }

    const partes = gabarito.split("-");

    if (partes.length < 2) {
      return Response.json({
        erro: "Gabarito inválido (use formato 1-C)"
      });
    }

    const correta = partes[1].trim().toUpperCase();

    let resultado = "📄 Correção\n\n";

    if (respostaAluno === correta) {
      resultado += `Questão ${partes[0]} - Correta ✅\n🎯 Nota: 10`;
    } else {
      resultado += `Questão ${partes[0]} - Errada ❌ (${respostaAluno})\n🎯 Nota: 0`;
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