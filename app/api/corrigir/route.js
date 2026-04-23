import OpenAI from "openai";

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("BODY:", body);

    const img = body.img;
    const pergunta = body.pergunta || "Corrija a prova";

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({
        erro: "SEM CHAVE OPENAI"
      });
    }

    if (!img) {
      return Response.json({
        erro: "SEM IMAGEM"
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
              text: pergunta
            },
            {
              type: "input_image",
              image_url: img
            }
          ]
        }
      ]
    });

    console.log("RESPOSTA IA:", response);

    return Response.json({
      resultado: response.output_text || "Sem resposta da IA"
    });

  } catch (error) {
    console.error("ERRO REAL COMPLETO:", error);

    return Response.json({
      erro: "Erro na IA",
      detalhe: JSON.stringify(error, null, 2)
    });
  }
}