export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🧠 PROMPT DE EXTRAÇÃO (FORÇA JSON LIMPO)
    const promptExtracao = `
Analise a imagem de uma prova escolar.

Identifique cada questão e retorne APENAS JSON válido.

NÃO escreva explicações.

Formato obrigatório:

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

    let conteudo = dataExtracao?.choices?.[0]?.message?.content;

    if (!conteudo) {
      return Response.json({
        erro: "IA não retornou conteúdo",
        detalhe: dataExtracao
      });
    }

    // 🔥 LIMPEZA DO JSON
    conteudo = conteudo
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const match = conteudo.match(/\[.*\]/s);

    if (!match) {
      return Response.json({
        erro: "Não consegui extrair JSON",
        detalhe: conteudo
      });
    }

    let questoes;

    try {
      questoes = JSON.parse(match[0]);
    } catch (e) {
      return Response.json({
        erro: "Erro ao interpretar JSON",
        detalhe: conteudo
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

    // 🔥 CORREÇÃO
    for (const q of questoes) {
      const num = q.numero;
      const tipo = q.tipo;
      const resposta = q.resposta;

      // 🟢 MULTIPLA ESCOLHA
      if (tipo === "multipla_escolha" && respostasCorretas[num]) {
        total++;

        const correta = respostasCorretas[num];

        if (!resposta || resposta === "?") {
          resultado += `Questão ${num} - ⚠️ Não identificada\n`;
          continue;
        }

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
Corrija uma resposta de aluno do ensino fundamental.

Resposta:
"${resposta}"

Avalie:
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
              { role: "user", content: promptCorrecao }
            ]
          })
        });

        const dataCorr = await correcao.json();

        const texto = dataCorr?.choices?.[0]?.message?.content || "";

        const matchNota = texto.match(/Nota:\s*(\d+(\.\d+)?)/);
        const nota = matchNota ? parseFloat(matchNota[1]) : 0;

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