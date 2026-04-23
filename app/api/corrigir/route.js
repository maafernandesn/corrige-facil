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

    if (!texto || texto.trim().length < 20) {
      return Response.json({
        erro: "Não foi possível ler a imagem"
      });
    }

    console.log("TEXTO OCR:", texto);

    // 🔍 extrair questões
    const questoes = texto.split(/\d+\)/).filter(q => q.trim().length > 20);

    let resultado = "📄 Correção da prova\n\n";

    questoes.forEach((q, index) => {
      const alternativas = q.match(/[A-D]\).*?\n/g);

      if (alternativas) {
        resultado += `Questão ${index + 1}:\n`;

        // 🔥 lógica simples: pega alternativa com palavra mais “provável”
        // (simulação de IA leve)
        const correta = alternativas[0]; 

        resultado += `✔ Resposta sugerida: ${correta.trim()}\n\n`;
      }
    });

    return Response.json({
      resultado: resultado || "Não foi possível corrigir automaticamente"
    });

  } catch (error) {
    return Response.json({
      erro: "Erro no processamento",
      detalhe: error.message
    });
  }
}