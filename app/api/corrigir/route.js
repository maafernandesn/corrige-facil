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

    const ocrData = await ocrResponse.json();

    if (!ocrData || ocrData.IsErroredOnProcessing) {
      return Response.json({
        erro: "Erro no OCR",
        detalhe: JSON.stringify(ocrData)
      });
    }

    const texto = ocrData?.ParsedResults?.[0]?.ParsedText;

    if (!texto || texto.trim().length < 5) {
      return Response.json({
        erro: "Não consegui ler a imagem"
      });
    }

    const linhas = texto.split("\n");

    const letras = ["A", "B", "C", "D"];
    let alternativas = [];

    // 🔥 pegar alternativas
    linhas.forEach(l => {
      if (/^[A-D]\)/i.test(l) || l.includes("•")) {
        alternativas.push(l);
      }
    });

    let respostaAluno = null;

    // 🔥 detectar marcação
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
        resultado: "⚠️ Não consegui identificar a resposta.\n\n" + texto
      });
    }

    // 🔥 gabarito
    const [q, correta] = gabarito.split("-");

    let resultado = "📄 Correção\n\n";

    if (respostaAluno === correta.trim().toUpperCase()) {
      resultado += `Questão ${q} - Correta ✅\n🎯 Nota: 10`;
    } else {
      resultado += `Questão ${q} - Errada ❌ (${respostaAluno})\n🎯 Nota: 0`;
    }

    return Response.json({ resultado });

  } catch (error) {
    return Response.json({
      erro: "Erro no processamento"
    });
  }
}