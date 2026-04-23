export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🔥 REDUZ IMAGEM (acelera MUITO)
    const base64 = img.split(",")[1].substring(0, 200000);

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

    const linhas = texto.split("\n").map(l => l.trim()).filter(Boolean);

    const letras = ["A", "B", "C", "D"];
    let respostas = [];
    let temp = [];

    linhas.forEach(l => {
      if (/^[A-D]/i.test(l) || l.includes("•")) {
        temp.push(l);
      }

      if (temp.length === 4) {
        let resp = null;

        temp.forEach((alt, i) => {
          if (alt.includes("•") || alt.includes("X") || alt.includes("/")) {
            resp = letras[i];
          }
        });

        respostas.push(resp);
        temp = [];
      }
    });

    if (!gabarito) {
      return Response.json({
        resultado: respostas.join(", ")
      });
    }

    const gabaritoMap = {};
    gabarito.split(",").forEach(item => {
      const [q, r] = item.split("-");
      gabaritoMap[q.trim()] = r.trim().toUpperCase();
    });

    let resultado = "📄 Correção\n\n";
    let acertos = 0;

    respostas.forEach((r, i) => {
      const correta = gabaritoMap[(i + 1).toString()];

      if (r === correta) {
        acertos++;
        resultado += `${i + 1} - Correta ✅\n`;
      } else {
        resultado += `${i + 1} - Errada ❌ (${r})\n`;
      }
    });

    const nota = ((acertos / respostas.length) * 10).toFixed(1);

    resultado += `\n🎯 Nota: ${nota}`;

    return Response.json({ resultado });

  } catch (error) {
    return Response.json({
      erro: "Erro (imagem grande demais)",
      detalhe: error.message
    });
  }
}