import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  const { img, gabarito } = await req.json();

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "system",
        content: "Corrija a prova com base no gabarito e dê a nota final."
      },
      {
        role: "user",
        content: [
          { type: "input_text", text: gabarito },
          { type: "input_image", image_url: img }
        ]
      }
    ]
  });

  return Response.json({
    resultado: response.output_text
  });
}
