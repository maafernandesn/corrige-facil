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
1. Leia o enunciado
2. Analise cada alternativa
3. Explique qual está correta

Formato:

Questão 1:
A) errado - motivo
B) errado - motivo
C) correto - motivo
D) errado - motivo

Resposta final: X

No FINAL da resposta, escreva:

RESUMO:
2:C
3:D
4:D
`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
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

    if (data.error) {
      return Response.json({
        erro: "Erro da API",
        detalhe: data.error.message || JSON.stringify(data.error)
      });
    }

    let respostaCompleta = data?.choices?.[0]?.message?.content;

    if (!respostaCompleta) {
      return Response.json({
        erro: "IA não respondeu",
        detalhe: JSON.stringify(data)
      });
    }

    // 🔥 LIMPA MARKDOWN
    respostaCompleta = respostaCompleta.replace(/\*\*/g, "").trim();

    // 🧠 MODO PROFESSOR
    if (modo === "professor") {
      return Response.json({ resultado: respostaCompleta });
    }

    // 🔥 EXTRAI APENAS LINHAS DO TIPO "2:C"
    const linhasValidas = respostaCompleta.match(/\d+\s*:\s*[A-D]/gi);

    if (!linhasValidas || linhasValidas.length === 0) {
      return Response.json({
        resultado: "⚠️ Não consegui extrair o resumo."
      });
    }

    const corretas = {};

    linhasValidas.forEach(linha => {
      const match = linha.match(/(\d+)\s*:\s*([A-D])/i);
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