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

    // 🧠 PROFESSOR
    if (modo === "professor") {
      return Response.json({ resultado: resposta });
    }

    // 🔥 LIMPEZA
    resposta = resposta
      .replace(/\u00A0/g, " ")
      .replace(/\*\*/g, "")
      .trim();

    // 🔥 EXTRAÇÃO REAL (BASEADA NO COMPORTAMENTO DA IA)
    const matches = [...resposta.matchAll(/Resposta correta:\s*([A-D])/gi)];

    if (matches.length === 0) {
      return Response.json({
        resultado: "⚠️ Não consegui extrair as respostas."
      });
    }

    // 🔥 organiza como 1,2,3
    const corretas = {};
    matches.forEach((m, i) => {
      corretas[i + 1] = m[1].toUpperCase();
    });

    // 🔥 respostas do aluno
    const aluno = {};
    respostasAlunoStr.split(",").forEach(par => {
      const [q, r] = par.trim().split("-");
      if (q && r) aluno[q] = r.toUpperCase();
    });

    let resultado = "";
    let acertos = 0;
    let total = matches.length;

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