export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    // OCR
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

    const respostasAluno = texto.match(/\d+\s*[A-D]/gi) || [];

    const gabaritoMap = {};
    gabarito.split(",").forEach(item => {
      const [q, r] = item.split("-");
      gabaritoMap[q.trim()] = r.trim().toUpperCase();
    });

    let resultado = "📄 Correção\n\n";
    let acertos = 0;
    let total = 0;

    respostasAluno.forEach(item => {
      const [num, resp] = item.split(/\s+/);
      total++;

      if (gabaritoMap[num] === resp.toUpperCase()) {
        acertos++;
        resultado += `${num} - Correta ✅\n`;
      } else {
        resultado += `${num} - Errada ❌ (${resp})\n`;
      }
    });

    const nota = ((acertos / total) * 10).toFixed(1);

    resultado += `\n🎯 Nota: ${nota}`;

    return Response.json({ resultado });

  } catch (error) {
    return Response.json({
      erro: "Erro",
      detalhe: error.message
    });
  }
}