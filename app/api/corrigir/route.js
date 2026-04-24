export async function POST(req) {
  try {
    const body = await req.json();
    const img = body.img;
    const modo = body.modo || "professor";
    const respostasAlunoStr = body.respostasAluno || "";

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    const prompt = `
Analise as perguntas da imagem.

Para cada pergunta:
- analise as alternativas
- explique qual está correta

No final escreva:

GABARITO:
Q2:C
Q3:D
Q4:D
`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: img } }
            ]
          }
        ]
      })
    });

    const data = await res.json();
    let resposta = data?.choices?.[0]?.message?.content;

    if (!resposta) {
      return Response.json({ erro: "IA não respondeu" });
    }

    // 🧠 MODO PROFESSOR
    if (modo === "professor") {
      return Response.json({ resultado: resposta });
    }

    // 🔥 NORMALIZA TEXTO
    resposta = resposta
      .replace(/\u00A0/g, " ")
      .replace(/\r/g, "")
      .replace(/\t/g, "")
      .replace(/\*\*/g, "")
      .trim();

    // 🔥 PEGA TUDO APÓS "GABARITO"
    const partes = resposta.split("GABARITO:");

    if (partes.length < 2) {
      return Response.json({
        resultado: "⚠️ Gabarito não encontrado."
      });
    }

    const bloco = partes[1];

    // 🔥 EXTRAI Q2:C etc
    const matches = bloco.match(/Q\s*\d+\s*:\s*[A-D]/gi);

    if (!matches) {
      return Response.json({
        resultado: "⚠️ Não consegui extrair o gabarito."
      });
    }

    const corretas = {};

    matches.forEach(item => {
      const clean = item.replace(/\s+/g, "");
      const [q, letra] = clean.split(":");
      const numero = q.replace("Q", "");

      corretas[numero] = letra;
    });

    // 🔥 RESPOSTAS DO ALUNO
    const aluno = {};
    respostasAlunoStr.split(",").forEach(par => {
      const [q, r] = par.trim().split("-");
      if (q && r) aluno[q] = r.toUpperCase();
    });

    let resultado = "";
    let acertos = 0;
    let total = Object.keys(corretas).length;

    Object.keys(corretas).forEach(q => {
      const correta = corretas[q];
      const respAluno = aluno[q];

      if (!respAluno) {
        resultado += `${q} - ⚠️ Sem resposta\n`;
        return;
      }

      if (respAluno === correta) {
        resultado += `${q} - ${correta} ✅\n`;
        acertos++;
      } else {
        resultado += `${q} - ${respAluno} ❌ (correta: ${correta})\n`;
      }
    });

    const nota = ((acertos / total) * 10).toFixed(1);

    resultado += `\n🎯 Nota: ${nota} (${acertos}/${total})`;

    return Response.json({ resultado });

  } catch (error) {
    return Response.json({
      erro: "Erro no servidor",
      detalhe: error.message
    });
  }
}