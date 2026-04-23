export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // OCR (sem cortar imagem)
    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: "helloworld",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `base64Image=${encodeURIComponent(img)}&language=por&OCREngine=2&scale=true&detectOrientation=true`
    });

    const ocrData = await ocrResponse.json();

    const texto = ocrData?.ParsedResults?.[0]?.ParsedText;

    console.log("OCR TEXTO:", texto);

    if (!texto || texto.trim().length < 3) {
      return Response.json({
        resultado: "⚠️ Não consegui ler bem a imagem.\n\nTente:\n- tirar foto mais perto\n- melhorar iluminação\n- evitar sombra\n\nOu envie uma imagem mais nítida."
      });
    }

    // pega respostas tipo "1 A"
    const respostasAluno = texto.match(/\d+\s*[A-D]/gi) || [];

    if (!gabarito) {
      return Response.json({
        resultado: `Texto identificado:\n\n${texto}`
      });
    }

    const gabaritoMap = {};
    gabarito.split(",").forEach(item => {
      const [q, r] = item.split("-");
      if (q && r) {
        gabaritoMap[q.trim()] = r.trim().toUpperCase();
      }
    });

    let resultado = "📄 Correção\n\n";
    let acertos = 0;
    let total = 0;

    respostasAluno.forEach(item => {
      const match = item.match(/(\d+)\s*([A-D])/i);
      if (!match) return;

      const num = match[1];
      const resp = match[2].toUpperCase();

      total++;

      if (gabaritoMap[num] === resp) {
        acertos++;
        resultado += `${num} - Correta ✅\n`;
      } else {
        resultado += `${num} - Errada ❌ (${resp})\n`;
      }
    });

    const nota = total > 0 ? ((acertos / total) * 10).toFixed(1) : 0;

    resultado += `\n🎯 Nota: ${nota}`;

    return Response.json({ resultado });

  } catch (error) {
    return Response.json({
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}