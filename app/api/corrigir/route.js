import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "system",
          content: `
Você é um corretor de provas de ensino fundamental.

Regras:
- Leia a imagem da prova
- Compare com o gabarito
- Corrija questão por questão
- Para dissertativas, avalie parcialmente se necessário
- No final, calcule a nota total

Formato de resposta:

Aluno: (se conseguir identificar)

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
    return Response.json({
      erro: "Erro ao processar a correção",
      detalhe: error.message
    }, { status: 500 });
  }
}
