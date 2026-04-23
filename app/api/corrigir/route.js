export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🔥 IA só lê respostas
    const prompt = `
Leia a imagem de uma prova objetiva.

REGRAS:
- Cada questão tem alternativas A, B, C, D
- O aluno marca com X, risco ou círculo
- Identifique VISUALMENTE a alternativa marcada
- NÃO inventar padrão

Responda SOMENTE assim:
1-A,2-B,3-C,4-D

Se não tiver certeza:
1-?,2-B,3-?,4-D
`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://seu-app.vercel.app",
        "X-Title": "CorrigeFacilIA"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: img }
              }
            ]
          }
        ]
      })
    });

    const data = await res.json();

    if (data.error) {
      return Response.json({
        erro: "Erro da API",
        detalhe: data.error.message
      });
    }

    const texto = data?.choices?.[0]?.message?.content;

    if (!texto) {
      return Response.json({
        erro: "IA não respondeu",
        detalhe: JSON.stringify(data)
      });
    }

    // 🔥 respostas do aluno
    const respostasAluno = {};
    texto.split(",").forEach(par => {
      const [q, r] = par.trim().split("-");
      if (q && r) respostasAluno[q] = r.toUpperCase();
    });

    // 🔥 gabarito
    const respostasCorretas = {};
    if (gabarito) {
      gabarito.split(",").forEach(par => {
        const [q, r] = par.trim().split("-");
        if (q && r) respostasCorretas[q] = r.toUpperCase();
      });
    }

    let resultado = "📄 Correção\n\n";
    let acertos = 0;
    let total = Object.keys(respostasCorretas).length;

    if (!gabarito) {
      Object.keys(respostasAluno).forEach(q => {
        resultado += `Questão ${q} - Alternativa: ${respostasAluno[q]}\n`;
      });

      return Response.json({ resultado });
    }

    Object.keys(respostasCorretas).forEach(q => {
      const aluno = respostasAluno[q];
      const correta = respostasCorretas[q];

      if (!aluno || aluno === "?") {
        resultado += `Questão ${q} - ⚠️ Não identificada\n`;
        return;
      }

      if (aluno === correta) {
        resultado += `Questão ${q} - ✅ Correta (${aluno})\n`;
        acertos++;
      } else {
        resultado += `Questão ${q} - ❌ Errada (${aluno}) | Correta: ${correta}\n`;
      }
    });

    const nota = total > 0 ? ((acertos / total) * 10).toFixed(1) : 0;

    resultado += `\n📊 Acertos: ${acertos}/${total}`;
    resultado += `\n🎯 Nota final: ${nota}`;

    return Response.json({ resultado });

  } catch (error) {
    return Response.json({
      erro: "Erro no servidor",
      detalhe: error.message
    });
  }
}