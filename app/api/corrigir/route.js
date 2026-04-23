export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // OCR
    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: "helloworld",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `base64Image=${encodeURIComponent(img)}&language=por&OCREngine=2&scale=true`
    });

    const ocrData = await ocrResponse.json();
    const texto = ocrData?.ParsedResults?.[0]?.ParsedText;

    console.log("OCR TEXTO:", texto);

    if (!texto) {
      return Response.json({ erro: "Não consegui ler a imagem" });
    }

    const linhas = texto.split("\n").map(l => l.trim()).filter(Boolean);

    // 🔥 pegar apenas linhas de alternativas (A, B, C, D)
    const alternativas = linhas.filter(l =>
      /^[A-D]\)/i.test(l) || l.includes("•")
    );

    console.log("ALTERNATIVAS:", alternativas);

    const letras = ["A", "B", "C", "D"];
    let respostaAluno = null;

    // 🔥 detectar qual linha está marcada
    for (let i = 0; i < alternativas.length; i++) {
      const linha = alternativas[i];

      if (
        linha.includes("•") ||
        linha.includes("X") ||
        linha.includes("/") ||
        linha.includes("*")
      ) {
        respostaAluno = letras[i] || null;
        break;
      }
    }

    if (!respostaAluno) {
      return Response.json({
        resultado: `⚠️ Não consegui identificar a alternativa marcada.\n\nTexto:\n${texto}`
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
    console.error("ERRO REAL:", error);

    return Response.json({
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}
