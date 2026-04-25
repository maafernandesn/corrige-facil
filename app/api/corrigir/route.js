export async function POST(req) {
  try {
    const body = await req.json();
    const img = body.img;
    const modo = body.modo || "professor";
    const respostasAlunoStr = body.respostasAluno || "";

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🔒 PROMPT MELHORADO (MAIS PRECISO)
    const prompt = `
Você é um corretor de provas.

SIGA O FORMATO EXATAMENTE.
SE NÃO SEGUIR, SUA RESPOSTA SERÁ DESCARTADA.

REGRAS IMPORTANTES:
- Apenas UMA alternativa correta por questão
- NÃO deduza respostas
- Use apenas o texto da imagem
- Escolha a alternativa mais literal e direta
- Evite interpretações genéricas
- NÃO use markdown
- NÃO use negrito
- NÃO escreva títulos extras

FORMATO OBRIGATÓRIO:

Questão 1
A) errado - motivo curto
B) errado - motivo curto
C) correto - motivo curto
D) errado - motivo curto
Resposta: C

Repita para todas as questões

No final escreva:

RESUMO FINAL:
1:C
2:C
3:D
4:D
`;

    async function chamarIA() {
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
      return data?.choices?.[0]?.message?.content;
    }

    // 🔁 RETRY AUTOMÁTICO
    let resposta = await chamarIA();

    if (
      !resposta ||
      !resposta.includes("RESUMO FINAL") ||
      !resposta.includes("Resposta:")
    ) {
      resposta = await chamarIA();
    }

    if (!resposta) {
      return Response.json({ erro: "IA não respondeu" });
    }

    // 🧠 MODO PROFESSOR
    if (modo === "professor") {
      return Response.json({ resultado: resposta });
    }

    // 🧹 LIMPEZA
    resposta = resposta
      .replace(/\u00A0/g, " ")
      .replace(/\r/g, "")
      .replace(/\t/g, "")
      .replace(/ +/g, " ")
      .trim();

    // 🔥 EXTRAÇÃO GLOBAL (FINAL E DEFINITIVA)
    const matches = resposta.match(/(\d+)\s*:\s*([A-D])/gi);

    if (!matches) {
      return Response.json({
        resultado: "⚠️ Não consegui extrair as respostas."
      });
    }

    const corretas = {};

    matches.forEach(item => {
      const match = item.match(/(\d+)\s*:\s*([A-D])/i);
      if (match) {
        corretas[match[1]] = match[2].toUpperCase();
      }
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