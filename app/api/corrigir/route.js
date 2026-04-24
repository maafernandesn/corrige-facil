export async function POST(req) {
  try {
    const { img } = await req.json();

    if (!img) {
      return Response.json({ erro: "Imagem não enviada" });
    }

    const prompt = `
Analise a imagem de uma questão de múltipla escolha.

Siga EXATAMENTE estes passos:

1. Leia o enunciado
2. Analise cada alternativa separadamente
3. Explique se está correta ou errada
4. Só depois escolha a resposta final

IMPORTANTE:
- NÃO chute
- NÃO use padrão (ex: sempre C)
- Analise cada alternativa com atenção
- Baseie-se no conteúdo escolar correto

Formato obrigatório:

Questão 1:
A) errado - motivo
B) errado - motivo
C) correto - motivo
D) errado - motivo

Resposta final: X
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

    const resposta = data?.choices?.[0]?.message?.content;

    if (!resposta) {
      return Response.json({
        erro: "IA não respondeu",
        detalhe: data
      });
    }

    return Response.json({ resultado: resposta });

  } catch (error) {
    return Response.json({
      erro: "Erro no servidor",
      detalhe: error.message
    });
  }
}