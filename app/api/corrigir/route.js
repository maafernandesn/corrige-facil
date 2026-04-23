import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    // 🔎 validações básicas
    if (!img) {
      return Response.json({
        erro: "Imagem não enviada"
      }, { status: 400 });
    }

    if (!gabarito) {
      return Response.json({
        erro: "Gabarito não informado"
      }, { status: 400 });
    }

    // 🧠 chamada para IA
    const response = await openai.responses.create({
      model: "gpt-4.1-mini", // modelo mais leve e confiável
      input: [
        {
          role: "system",
          content: `
Você é um corretor de provas do ensino fundamental.

Regras:
- Leia a imagem da prova
- Compare com o gabarito fornecido
- Corrija questão por questão
- Para dissertativas, avalie parcialmente
- No final, calcule a nota

Responda de forma simples assim:

1 - Correta ✅
2 - Errada ❌ (correta: X)
3 - Parcial (0,5)

Nota final: X
`
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Gabarito:\n${gabarito}`
            },
            {
              type: "input_image",
              image_url: img
            }
          ]
        }
      ]
    });

    return Response.json({
      resultado: response.output_text
    });

  } catch (error) {
    console.error("ERRO COMPLETO:", error);

    return Response.json({
      erro: "Erro ao processar a correção",
      detalhe: error.message || "Erro desconhecido",
      dica: "Verifique chave da OpenAI ou crédito disponível"
    }, { status: 500 });
  }
}
