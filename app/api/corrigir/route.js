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

IMPORTANTE:
No final da resposta, escreva EXATAMENTE:

GABARITO:
Q2:C
Q3:D
Q4:D

Não mude esse formato.
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
    const resposta = data?.choices?.[0]?.message?.content;

    if (!resposta) {
      return Response.json({ erro: "IA não respondeu" });
    }

    // 🧠 MODO PROFESSOR
    if (modo === "professor") {
      return Response.json({ resultado: resposta });
    }

    // 🔥 EXTRAÇÃO ROBUSTA
    const matches = [...resposta.matchAll(/Q(\d+)\s*:\s*([A-D])/gi)];

    if (matches.length === 0) {
      return Response.json({
        resultado: "⚠️ Não consegui extrair o gabarito."
      });
    }

    const corretas = {};
    matches.forEach(m => {
      corretas[m[1]] = m[2].toUpperCase();
    });

    // 🔥 respostas do aluno
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
        resultado += q + " - ⚠️ Sem resposta\n";
        return;
      }

      if (respAluno === correta) {
        resultado += q + " - " + correta + " ✅\n";
        acertos++;
      } else {
        resultado += q + " - " + respAluno + " ❌ (correta: " + correta + ")\n";
      }
    });

    const nota = ((acertos / total) * 10).toFixed(1);

    resultado += "\n🎯 Nota: " + nota + " (" + acertos + "/" + total + ")";

    return Response.json({ resultado });

  } catch (error) {
    return Response.json({
      erro: "Erro no servidor",
      detalhe: error.message
    });
  }
}