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

    const linhas = texto.split("\n");

    // 🔥 pegar apenas alternativas
    const alternativas = linhas.filter(l =>
      l.match(/^[A-D]\)/i) || l.includes("•")
    );

    let respostaAluno = null;

    alternativas.forEach((linha, index) => {
      const l = linha.trim();

      // 🔥 se tem marcação
      if (l.startsWith("•") || l.includes("•") || l.includes("X") || l.includes("/")) {
        // posição define alternativa
        const letras = ["A", "B", "C", "D"];
        respostaAluno = letras[index];
      }
    });

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
    return Response.json({
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}