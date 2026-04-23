export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🔥 IA só extrai respostas
    const prompt = `
Leia a imagem da prova.

Identifique cada questão e a alternativa marcada.

Responda SOMENTE assim:
1-A,2-B,3-C,4-D

Não explique nada.
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

    const texto = data?.choices?.[0]?.message?.content;

    if (!texto) {
      return Response.json({
        erro: "IA não respondeu",
        detalhe: JSON.stringify(data)
      });
    }

    // 🔥 transforma resposta IA em objeto
    const respostasAluno = {};
    texto.split(",").forEach(par => {
      const [q, r] = par.trim().split("-");
      if (q && r) respostasAluno[q] = r.toUpperCase();
    });

    // 🔥 transforma gabarito
    const respostasCorretas = {};
    gabarito.split(",").forEach(par => {
      const [q, r] = par.trim().split("-");
      if (q && r) respostasCorretas[q] = r.toUpperCase();
    });

    // 🔥 CORREÇÃO REAL (100% precisa)
    let resultado = "📄 Correção\n\n";
    let acertos = 0;
    let total = Object.keys(respostasCorretas).length;

    Object.keys(respostasCorretas).forEach(q => {
      const aluno = respostasAluno[q];
      const correta = respostasCorretas[q];

      if (!aluno) {
        resultado += `Questão ${q} - Não identificada ⚠️\n`;
        return;
      }

      if (aluno === correta) {
        resultado += `Questão ${q} - Correta ✅ (${aluno})\n`;
        acertos++;
      } else {
        resultado += `Questão ${q} - Errada ❌ (${aluno})\n`;
      }
    });

    const nota = ((acertos / total) * 10).toFixed(1);

    resultado += `\n🎯 Nota final: ${nota}`;

    return Response.json({ resultado });

  } catch (error) {
    return Response.json({
      erro: "Erro no servidor",
      detalhe: error.message
    });
  }
}