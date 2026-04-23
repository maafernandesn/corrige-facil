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

    if (!ocrData || ocrData.IsErroredOnProcessing) {
      return Response.json({
        erro: "Erro no OCR",
        detalhe: JSON.stringify(ocrData)
      });
    }

    const texto = ocrData.ParsedResults?.[0]?.ParsedText;

    if (!texto) {
      return Response.json({
        erro: "OCR não retornou texto"
      });
    }

    const linhas = texto
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    console.log("LINHAS:", linhas);

    const letras = ["A", "B", "C", "D"];
    let respostasDetectadas = [];

    let alternativasTemp = [];

    linhas.forEach(linha => {
      // pega alternativas
      if (/^[A-D]\)/i.test(linha) || linha.includes("•")) {
        alternativasTemp.push(linha);
      }

      // quando tem 4 alternativas → é uma questão
      if (alternativasTemp.length === 4) {
        let resposta = null;

        alternativasTemp.forEach((alt, index) => {
          if (
            alt.includes("•") ||
            alt.includes("X") ||
            alt.includes("/") ||
            alt.includes("*")
          ) {
            resposta = letras[index];
          }
        });

        respostasDetectadas.push(resposta);
        alternativasTemp = [];
      }
    });

    console.log("RESPOSTAS:", respostasDetectadas);

    if (!gabarito) {
      return Response.json({
        resultado: "Respostas detectadas: " + respostasDetectadas.join(", ")
      });
    }

    // GABARITO
    const gabaritoMap = {};
    gabarito.split(",").forEach(item => {
      const [q, r] = item.split("-");
      if (q && r) {
        gabaritoMap[q.trim()] = r.trim().toUpperCase();
      }
    });

    let resultado = "📄 Correção\n\n";
    let acertos = 0;
    let total = respostasDetectadas.length;

    respostasDetectadas.forEach((resp, index) => {
      const num = (index + 1).toString();
      const correta = gabaritoMap[num];

      if (!resp) {
        resultado += `${num} - Não identificado ⚠️\n`;
        return;
      }

      if (resp === correta) {
        acertos++;
        resultado += `${num} - Correta ✅\n`;
      } else {
        resultado += `${num} - Errada ❌ (${resp})\n`;
      }
    });

    const nota = total > 0 ? ((acertos / total) * 10).toFixed(1) : 0;

    resultado += `\n🎯 Nota final: ${nota}`;

    return Response.json({ resultado });

  } catch (error) {
    console.error("ERRO:", error);

    return Response.json({
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}