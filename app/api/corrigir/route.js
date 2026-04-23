import OpenAI from "openai";

export async function POST(req) {
  try {
    const { img, gabarito } = await req.json();

    // 🔑 validação básica
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({
        erro: "Chave da OpenAI não configurada no Vercel"
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 🧠 teste simples primeiro (sem imagem)
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `Corrija com base no gabarito abaixo:

${gabarito}

Se não houver imagem válida, apenas responda:
"IA conectada com sucesso ✅"`
    });

    return Response.json({
      resultado: response.output_text
    });

  } catch (error) {
    console.error("ERRO:", error);

    return Response.json({
      erro: "Erro na IA",
      detalhe: error.message
    });
  }
}
