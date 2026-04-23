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
      body: `base64Image=${encodeURIComponent(img)}&language=por&OCREngine=2`
    });

    const ocrData = await ocrResponse.json();
    const texto = ocrData?.ParsedResults?.[0]?.ParsedText;

    if (!texto) {
      return Response.json({ erro: "Não consegui ler a imagem" });
    }

    const linhas = texto.split("\n").map(l => l.trim()).filter(Boolean);

    // 🔥 separar por questão
    let questoes = [];
    let atual = [];

    linhas.forEach(l => {
      if (/^\d+\)/.test(l) && atual.length > 0) {
        questoes.push(atual);
        atual = [];
      }
      atual.push(l);
    });

    if (atual.length > 0) questoes.push(atual);

    const letras = ["A", "B", "C", "D"];
    let respostas = [];

    // 🔥 processar cada questão
    questoes.forEach(q => {
      let alternativas = q.filter(l =>
        /^[A-D]\)/i.test(l) ||
        l.includes("*") ||
        l.includes("•") ||
        l.includes("X") ||
        l.includes("/")
      );

      let resposta = null;

      alternativas.forEach((alt, i) => {
        if (
          alt.includes("*") ||
          alt.includes("•") ||
          alt.includes("X") ||
          alt.includes("/")
        ) {
          resposta = letras[i];
        }
      });

      respostas.push(resposta);
    });

    if (!gabarito) {
      return Response.json({
        resultado: "Respostas detectadas: " + respostas.join(", ")
      });
    }

    // 🔥 corrigir
    const gabaritoArr = gabarito.split(",");

    let resultado = "📄 Correção\n\n";
    let acertos = 0;

    respostas.forEach((resp, i) => {
      const correta = gabaritoArr[i]?.split("-")[1]?.trim().toUpperCase();

      if (!resp) {
        resultado += `${i + 1} - Não identificado ⚠️\n`;
        return;
      }

      if (resp === correta) {
        acertos++;
        resultado += `${i + 1} - Correta ✅\n`;
      } else {
        resultado += `${i + 1} - Errada ❌ (${resp})\n`;
      }
    });

    const nota = ((acertos / respostas.length) * 10).toFixed(1);

    resultado += `\n🎯 Nota final: ${nota}`;

    return Response.json({ resultado });

  } catch (error) {
    return Response.json({
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}
