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
      body: `base64Image=${encodeURIComponent(img)}&language=por`
    });

    const ocrData = await ocrResponse.json();
    const texto = ocrData?.ParsedResults?.[0]?.ParsedText;

    if (!texto) {
      return Response.json({ erro: "Não consegui ler a imagem" });
    }

    const linhas = texto
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    let questoes = [];
    let bloco = [];

    // 🔥 separar blocos por números (01), 02), etc
    linhas.forEach(l => {
      if (/^\d+/.test(l) && bloco.length > 0) {
        questoes.push(bloco);
        bloco = [];
      }
      bloco.push(l);
    });

    if (bloco.length > 0) questoes.push(bloco);

    let respostas = [];

    // 🔥 detectar resposta em cada questão
    questoes.forEach(q => {
      let alternativas = q.filter(l =>
        l.length < 50 // ignora enunciado grande
      );

      let resposta = null;

      alternativas.forEach((alt, index) => {
        if (
          alt.includes("*") ||
          alt.includes("•") ||
          alt.includes("X") ||
          alt.includes("/")
        ) {
          const letras = ["A", "B", "C", "D"];
          resposta = letras[index];
        }
      });

      respostas.push(resposta);
    });

    if (!gabarito) {
      return Response.json({
        resultado: "Detectado: " + respostas.join(", ")
      });
    }

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