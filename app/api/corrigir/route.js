export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    if (!img) {
      return Response.json({
        erro: "Imagem não enviada"
      });
    }

    const prompt = gabarito
      ? `Você é um corretor de provas EXTREMAMENTE rigoroso.

Analise a imagem com atenção total:

REGRAS IMPORTANTES:
- Leia cada questão separadamente
- NÃO repita respostas automaticamente
- Identifique VISUALMENTE a alternativa marcada (X, círculo, traço, etc.)
- Compare com o gabarito: ${gabarito}
- Se não tiver certeza, escreva: "Não identificado"

PROIBIDO:
- Assumir padrão (ex: tudo C)
- Inventar resposta sem evidência

Responda EXATAMENTE assim:

📄 Correção

Questão 1 - Correta ou Errada (marcada: X)
Questão 2 - Correta ou Errada (marcada: X)
Questão 3 - Correta ou Errada (marcada: X)

🎯 Nota final: X`
      : `Você é um leitor de provas MUITO preciso.

REGRAS:
- Analise cada questão separadamente
- Identifique VISUALMENTE a alternativa marcada
- NÃO repita respostas iguais automaticamente
- Se não tiver certeza, escreva: "Não identificado"

Responda assim:

Questão 1 - Alternativa: X
Questão 2 - Alternativa: X
Questão 3 - Alternativa: X`;

    async function chamarIA(modelo) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://seu-app.vercel.app",
          "X-Title": "CorrigeFacilIA"
        },
        body: JSON.stringify({
          model: modelo,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: img
                  }
                }
              ]
            }
          ]
        })
      });

      return res.json();
    }

    // 🔥 Primeira tentativa (rápida)
    let data = await chamarIA("openai/gpt-4o-mini");

    let resposta = data?.choices?.[0]?.message?.content;

    // 🔥 Fallback automático (se vier ruim)
    if (
      !resposta ||
      resposta.includes("C\n") ||
      resposta.match(/Alternativa: C/g)?.length >= 3
    ) {
      console.log("⚠️ Resposta suspeita, tentando modelo melhor...");

      data = await chamarIA("openai/gpt-4o");
      resposta = data?.choices?.[0]?.message?.content;
    }

    // 🔥 erro da API
    if (data.error) {
      return Response.json({
        erro: "Erro da API",
        detalhe: data.error.message || JSON.stringify(data.error)
      });
    }

    if (!resposta) {
      return Response.json({
        erro: "IA não respondeu",
        detalhe: JSON.stringify(data)
      });
    }

    return Response.json({
      resultado: resposta
    });

  } catch (error) {
    return Response.json({
      erro: "Erro no servidor",
      detalhe: error.message
    });
  }
}