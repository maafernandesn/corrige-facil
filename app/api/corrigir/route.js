export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🔥 REDUZ TAMANHO (evita travar)
    const base64 = img.split(",")[1].substring(0, 300000);

    // OCR mais rápido
    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: "helloworld",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `base64Image=data:image/jpeg;base64,${base64}&language=eng&OCREngine=1`
    });

    const ocrData = await ocrResponse.json();

    const texto = ocrData?.ParsedResults?.[0]?.ParsedText;

    if (!texto) {
      return Response.json({
        erro: "OCR não conseguiu ler"
      });
    }

    console.log("OCR:", texto);

    // 🔍 pega respostas
    const respostasAluno = texto.match(/\d+\s*[A-D]/gi) || [];

    if (!gabarito) {
      return Response.json({
        resultado: "Texto identificado:\n\n" + texto
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
    console.error(error);

    return Response.json({
      erro: "Erro no processamento (timeout ou imagem pesada)",
      detalhe: error.message
    });
  }
}