export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    // 🔥 PROMPT MAIS FORTE
    const promptExtracao = `
Leia a prova da imagem.

Identifique TODAS as questões.

Para cada questão:
- número
- tipo (multipla_escolha ou dissertativa)
- resposta do aluno

RETORNE APENAS JSON:

[
  { "numero": 1, "tipo": "multipla_escolha", "resposta": "A" }
]

IMPORTANTE:
- Nunca retorne lista vazia
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

    let conteudo = dataExtracao?.choices?.[0]?.message?.content || "";

    // 🔥 LIMPEZA
    conteudo = conteudo
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const match = conteudo.match(/\[.*\]/s);

    if (!match) {
      return Response.json({
        erro: "IA não retornou JSON válido",
        detalhe: conteudo
      });
    }

    let questoes = [];

    try {
      questoes = JSON.parse(match[0]);
    } catch (e) {
      return Response.json({
        erro: "Erro ao interpretar JSON",
        detalhe: conteudo
      });
    }

    // 🔥 GARANTIA: se vier vazio, erro claro
    if (!Array.isArray(questoes) || questoes.length === 0) {
      return Response.json({
        erro: "Nenhuma questão identificada",
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

    for (const q of questoes) {
      const num = String(q.numero);
      const tipo = q.tipo;
      const resposta = (q.resposta || "").toUpperCase();

      // 🟢 MULTIPLA
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
Corrija a resposta:

"${resposta}"

Dê nota de 0 a 1 e comentário.

Formato:
Nota: X
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

        resultado += `Questão ${num} - 📝 (${nota})\n${texto}\n\n`;
      }
    }

    if (total === 0) {
      return Response.json({
        erro: "Nenhuma questão válida para correção",
        detalhe: questoes
      });
    }

    const notaFinal = ((acertos / total) * 10).toFixed(1);

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
