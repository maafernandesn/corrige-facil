export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🧠 ETAPA 1 — EXTRAIR QUESTÕES
    const promptExtracao = `
Analise a imagem de uma prova escolar.

Para cada questão:
- Identifique o número
- Identifique o tipo:
  - multipla_escolha
  - dissertativa
- Identifique a resposta do aluno

Responda em JSON:

[
  {
    "numero": 1,
    "tipo": "multipla_escolha",
    "resposta": "A"
  },
  {
    "numero": 2,
    "tipo": "dissertativa",
    "resposta": "texto do aluno"
  }
]
`;

    const extracao = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
              { type: "text", text: promptExtracao },
              { type: "image_url", image_url: { url: img } }
            ]
          }
        ]
      })
    });

    const dataExtracao = await extracao.json();

    let questoes;

    try {
      questoes = JSON.parse(
        dataExtracao.choices[0].message.content
      );
    } catch {
      return Response.json({
        erro: "Erro ao interpretar prova",
        detalhe: dataExtracao
      });
    }

    // 🔥 GABARITO
    const respostasCorretas = {};
    if (gabarito) {
      gabarito.split(",").forEach(par => {
        const [q, r] = par.trim().split("-");
        if (q && r) respostasCorretas[q] = r.toUpperCase();
      });
    }

    let resultado = "📄 Correção\n\n";
    let acertos = 0;
    let total = 0;

    // 🔥 ETAPA 2 — CORREÇÃO
    for (const q of questoes) {
      const num = q.numero;
      const tipo = q.tipo;
      const resposta = q.resposta;

      // 🟢 MULTIPLA ESCOLHA
      if (tipo === "multipla_escolha" && respostasCorretas[num]) {
        total++;

        const correta = respostasCorretas[num];

        if (resposta === correta) {
          resultado += `Questão ${num} - ✅ Correta (${resposta})\n`;
          acertos++;
        } else {
          resultado += `Questão ${num} - ❌ Errada (${resposta}) | Correta: ${correta}\n`;
        }
      }

      // 🔵 DISSERTATIVA
      if (tipo === "dissertativa") {
        total++;

        const promptCorrecao = `
Corrija a resposta de um aluno do ensino fundamental.

Resposta do aluno:
"${resposta}"

Dê:
- nota de 0 a 1
- comentário simples

Formato:
Nota: 0.8
Comentário: ...
`;

        const correcao = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
                content: promptCorrecao
              }
            ]
          })
        });

        const dataCorr = await correcao.json();

        const texto = dataCorr?.choices?.[0]?.message?.content || "";

        const match = texto.match(/Nota:\s*(\d+(\.\d+)?)/);
        const nota = match ? parseFloat(match[1]) : 0;

        acertos += nota;

        resultado += `Questão ${num} - 📝 Dissertativa (${nota})\n`;
        resultado += `${texto}\n\n`;
      }
    }

    const notaFinal = total > 0 ? ((acertos / total) * 10).toFixed(1) : 0;

    resultado += `\n📊 Resultado: ${acertos.toFixed(1)}/${total}`;
    resultado += `\n🎯 Nota final: ${notaFinal}`;

    return Response.json({ resultado });

  } catch (error) {
    return Response.json({
      erro: "Erro no servidor",
      detalhe: error.message
    });
  }
}