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

    if (!texto || texto.trim().length < 5) {
      return Response.json({
        erro: "Não foi possível ler a imagem"
      });
    }

    console.log("TEXTO OCR:", texto);

    // 🧠 "IA" simples (lógica automática)
    const linhas = texto.split("\n").filter(l => l.trim() !== "");

    let resultado = "📄 Correção da prova\n\n";
    let nota = 0;
    let total = 0;

    linhas.forEach((linha, index) => {
      // exemplo simples: detecta respostas tipo A, B, C, D
      const match = linha.match(/[A-D]/i);

      if (match) {
        total++;

        // regra fictícia: considera A como correta (exemplo)
        if (match[0].toUpperCase() === "A") {
          nota++;
          resultado += `${index + 1} - Correta ✅\n`;
        } else {
          resultado += `${index + 1} - Errada ❌ (${match[0]})\n`;
        }
      }
    });

    if (total === 0) {
      return Response.json({
        resultado: `Texto identificado:\n\n${texto}`
      });
    }

    const notaFinal = ((nota / total) * 10).toFixed(1);

    resultado += `\n🎯 Nota final: ${notaFinal}`;

    return Response.json({
      resultado
    });

  } catch (error) {
    console.error(error);

    return Response.json({
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}