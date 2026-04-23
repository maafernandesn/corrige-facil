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

    if (!texto || texto.trim().length < 3) {
      return Response.json({
        erro: "Não consegui ler a imagem"
      });
    }

    // 🔥 NORMALIZA TEXTO
    const textoLimpo = texto
      .replace(/[^A-Za-z0-9\n ]/g, " ") // remove símbolos
      .replace(/\s+/g, " "); // remove espaços duplicados

    console.log("TEXTO LIMPO:", textoLimpo);

    // 🔥 PEGA RESPOSTAS (mais inteligente)
    const respostasAluno = [];

    const regex = /(\d{1,2})\s*([A-D])/gi;
    let match;

    while ((match = regex.exec(textoLimpo)) !== null) {
      respostasAluno.push({
        num: match[1],
        resp: match[2].toUpperCase()
      });
    }

    console.log("RESPOSTAS DETECTADAS:", respostasAluno);

    if (!gabarito) {
      return Response.json({
        resultado: `Texto identificado:\n\n${texto}`
      });
    }

    // 🔥 GABARITO
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
      total++;

      if (gabaritoMap[item.num] === item.resp) {
        acertos++;
        resultado += `${item.num} - Correta ✅\n`;
      } else {
        resultado += `${item.num} - Errada ❌ (${item.resp})\n`;
      }
    });

    if (total === 0) {
      return Response.json({
        resultado: `⚠️ Não consegui identificar as respostas.\n\nTexto:\n${texto}`
      });
    }

    const nota = ((acertos / total) * 10).toFixed(1);

    resultado += `\n🎯 Nota: ${nota}`;

    return Response.json({ resultado });

  } catch (error) {
    return Response.json({
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}