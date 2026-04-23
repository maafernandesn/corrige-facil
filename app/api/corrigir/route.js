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

    const textoMaiusculo = texto.toUpperCase();

    let respostaAluno = null;

    // 🔥 padrões possíveis
    const padroes = {
      A: [/A\s*[X\/]/, /[X\/]\s*A/, /AX/, /XA/, /A\/|\/A/],
      B: [/B\s*[X\/]/, /[X\/]\s*B/, /BX/, /XB/, /B\/|\/B/],
      C: [/C\s*[X\/]/, /[X\/]\s*C/, /CX/, /XC/, /C\/|\/C/],
      D: [/D\s*[X\/]/, /[X\/]\s*D/, /DX/, /XD/, /D\/|\/D/],
    };

    for (const letra in padroes) {
      const regexList = padroes[letra];

      if (regexList.some(r => r.test(textoMaiusculo))) {
        respostaAluno = letra;
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
    return Response.json({
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}