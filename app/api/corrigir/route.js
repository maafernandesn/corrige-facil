import OpenAI from "openai";

export async function POST(req) {
  try {
    const { img, pergunta } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({
        erro: "Chave OpenAI não configurada"
      });
    }

    if (!img) {
      return Response.json({
        erro: "Imagem não enviada"
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: pergunta || "Corrija a prova e dê a nota"
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
    console.error(error);

    return Response.json({
      erro: "Erro na IA",
      detalhe: error.message
    });
  }
}
