import OpenAI from "openai";

export async function POST(req) {
  try {
    const { img, pergunta } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({
        erro: "Chave da OpenAI não configurada"
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: `
Você é um professor do ensino fundamental.

Funções:
- Corrigir provas a partir de imagem
- Dar nota de 0 a 10
- Explicar erros
- Responder perguntas sobre a prova

Se o usuário pedir correção:
- Liste questões
- Diga certo/errado
- Dê nota final
`
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: pergunta || "Corrija esta prova e dê a nota"
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
      erro: "Erro na IA",
      detalhe: error.message
    });
  }
}
