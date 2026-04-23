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
      body: `base64Image=${encodeURIComponent(img)}&language=por&OCREngine=2`
    });

    const ocrData = await ocrResponse.json();

    const texto = ocrData?.ParsedResults?.[0]?.ParsedText;

    if (!texto) {
      return Response.json({
        erro: "Não consegui ler a imagem"
      });
    }

    const linhas = texto
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    // 🔥 pegar apenas linhas de alternativas
    const alternativas = linhas.filter(l =>
      l.match(/^[A-D]\)/i) ||
      l.includes("*") ||
      l.includes("•") ||
      l.includes("X") ||
      l.includes("/")
    );

    const letras = ["A", "B", "C", "D"];

    let respostaAluno = null;

    // 🔥 usar posição (ordem)
    for (let i = 0; i < alternativas.length; i++) {
      const alt = alternativas[i];

      if (
        alt.includes("*") ||
        alt.includes("•") ||
        alt.includes("X") ||
        alt.includes("/")
      ) {
        respostaAluno = letras[i];
        break;
      }
    }

    if (!respostaAluno) {
      return Response.json({
        resultado: "⚠️ Não consegui identificar a resposta.\n\n" + texto
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
      erro: "Erro no processamento"
    });
  }
}