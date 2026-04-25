export async function POST(req) {
  try {
    const body = await req.json();
    const img = body.img;
    const modo = body.modo || "professor";

    // 🔥 fallback para teste (remove depois se quiser)
    const respostasAlunoStr =
      body.respostasAluno || "1-C,2-C,3-D,4-D";

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🧠 PROMPT MAIS INTELIGENTE
    const prompt = `
Você é um professor corrigindo uma prova.

REGRAS IMPORTANTES:
- Leia o texto com atenção
- NÃO use conhecimento externo
- NÃO chute respostas
- Use apenas o que está escrito
- Existe apenas UMA alternativa correta

FORMATO:

Questão 1
A) ...
B) ...
C) ...
D) ...
Resposta: X

Repita para todas as questões.
`;

    async function chamarIA() {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          // 🔥 pode trocar para melhorar precisão
          model: "openai/gpt-4o", 
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

      if (data.error) {
        throw new Error(data.error.message || "Erro da API");
      }

      return data?.choices?.[0]?.message?.content;
    }

    // 🔁 RETRY AUTOMÁTICO
    let resposta = await chamarIA();

    if (!resposta || !resposta.includes("Resposta:")) {
      resposta = await chamarIA();
    }

    if (!resposta) {
      return Response.json({ erro: "IA não respondeu" });
    }

    // 🧠 MODO PROFESSOR
    if (modo === "professor") {
      return Response.json({ resultado: resposta });
    }

    // 🧹 LIMPEZA FORTE
    resposta = resposta
      .replace(/\u00A0/g, " ")
      .replace(/\r/g, "")
      .replace(/\t/g, "")
      .replace(/\*\*/g, "")
      .replace(/ +/g, " ")
      .trim();

    // 🔥 EXTRAÇÃO ROBUSTA DAS RESPOSTAS
    const matches = [...resposta.matchAll(/Resposta:\s*([A-D])/gi)];

    if (matches.length === 0) {
      return Response.json({
        erro: "Não consegui extrair respostas da IA",
        debug: resposta
      });
    }

    const corretas = {};
    matches.forEach((m, i) => {
      corretas[(i + 1).toString()] = m[1].toUpperCase();
    });

    // 🔥 PROCESSA RESPOSTAS DO ALUNO
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

    const nota = total > 0
      ? ((acertos / total) * 10).toFixed(1)
      : 0;

    resultado += `\n🎯 Nota: ${nota} (${acertos}/${total})`;

    return Response.json({ resultado });

  } catch (error) {
    return Response.json({
      erro: "Erro no servidor",
      detalhe: error.message
    });
  }
}