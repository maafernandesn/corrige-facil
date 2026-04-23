import OpenAI from "openai";

export async function POST(req) {
  try {
    const { imgs, pergunta } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({
        erro: "Chave da OpenAI não configurada"
      });
    }

    if (!imgs || imgs.length === 0) {
      return Response.json({
        erro: "Nenhuma imagem enviada"
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 🧠 monta conteúdo com várias imagens
    const conteudo = [
      {
        type: "input_text",
        text: pergunta || "Corrija as provas e dê a nota"
      }
    ];

    imgs.forEach(img => {
      conteudo.push({
        type: "input_image",
        image_url: img
      });
    });

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: `
Você é um professor do ensino fundamental.

Tarefas:
- Corrigir provas a partir de imagens
- Identificar respostas
- Apontar erros
- Dar nota de 0 a 10
- Explicar brevemente os erros
`
        },
        {
          role: "user",
          content: conteudo
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