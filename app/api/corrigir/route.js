export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: "helloworld",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `base64Image=${encodeURIComponent(img)}&language=por`
    });

    const ocrData = await ocrResponse.json();

    if (!ocrData || ocrData.IsErroredOnProcessing) {
      return Response.json({ erro: "Erro no OCR" });
    }

    const texto = ocrData?.ParsedResults?.[0]?.ParsedText;

    if (!texto) {
      return Response.json({ erro: "Não consegui ler a imagem" });
    }

    const linhas = texto.split("\n").map(l => l.trim()).filter(Boolean);

    let alternativas = [];
    const letras = ["A", "B", "C", "D"];

    // pega alternativas simples
    for (let i = 0; i < linhas.length; i++) {
      const l = linhas[i];

      if (
        l.startsWith("A") ||
        l.startsWith("B") ||
        l.startsWith("C") ||
        l.startsWith("D") ||
        l.includes("*") ||
        l.includes("•") ||
        l.includes("X") ||
        l.includes("/")
      ) {
        alternativas.push(l);
      }
    }

    let respostaAluno = null;

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
        resultado: "Não consegui identificar resposta.\n\n" + texto
      });
    }

    const partes = gabarito.split("-");
    const correta = partes[1]?.trim().toUpperCase();

    let resultado = "📄 Correção\n\n";

    if (respostaAluno === correta) {
      resultado += `Questão ${partes[0]} - Correta ✅\n🎯 Nota: 10`;
    } else {
      resultado += `Questão ${partes[0]} - Errada ❌ (${respostaAluno})\n🎯 Nota: 0`;
    }

    return Response.json({ resultado });

  } catch (error) {
    return Response.json({
      erro: "Erro no processamento"
    });
  }
}