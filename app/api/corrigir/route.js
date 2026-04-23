export async function POST(req) {
  try {
    const { img } = await req.json();

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

    // 🔥 FILTRAR LINHAS REAIS
    const linhas = texto.split("\n").filter(l =>
      /^\d+\s*[A-D]$/i.test(l.trim())
    );

    let resultado = "📄 Correção da prova\n\n";
    let nota = 0;
    let total = 0;

    // 🔥 LIMITAR A 20 QUESTÕES (evita lixo do OCR)
    const limite = Math.min(linhas.length, 20);

    for (let i = 0; i < limite; i++) {
      const linha = linhas[i];
      const resposta = linha.match(/[A-D]/i)[0].toUpperCase();

      total++;

      // exemplo: A correta
      if (resposta === "A") {
        nota++;
        resultado += `${i + 1} - Correta ✅\n`;
      } else {
        resultado += `${i + 1} - Errada ❌ (${resposta})\n`;
      }
    }

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
    return Response.json({
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}