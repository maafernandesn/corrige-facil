export async function POST(req) {
  try {
    const body = await req.json();
    const { img, modo = "professor", gabaritoOficial = null } = body;

    if (!img) return Response.json({ erro: "Imagem necessária" }, { status: 400 });

    // --- PASSO 1: TRIAGEM DE COMPLEXIDADE ---
    // Usamos o modelo barato para decidir se precisamos do caro.
    const triagemRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Analise esta prova. Ela contém questões de fonética (sons de letras), interpretação de textos longos ou a caligrafia está difícil? Responda apenas 'SIM' ou 'NAO'." },
            { type: "image_url", image_url: { url: img } }
          ]
        }],
        temperature: 0
      })
    });

    const triagemData = await triagemRes.json();
    const eComplexo = triagemData.choices[0].message.content.includes("SIM");

    // --- PASSO 2: ESCOLHA DO MODELO ---
    // Se for modo Tutor OU se a triagem deu SIM, usamos o modelo potente.
    // Caso contrário, seguimos com o mini para economizar.
    const modeloEscolhido = (eComplexo || modo === "tutor") 
      ? "openai/gpt-4o" 
      : "openai/gpt-4o-mini";

    console.log(`Usando modelo: ${modeloEscolhido} (Complexidade: ${eComplexo})`);

    // --- PASSO 3: EXECUÇÃO REAL ---
    let promptSistema = "";
    if (modo === "professor") {
      promptSistema = `Aja como um professor especialista. Gere um gabarito preciso. JSON: {"1": "A"}`;
    } else if (modo === "fast") {
      promptSistema = `Identifique o que o aluno marcou na imagem. JSON: {"1": "A"}`;
    } else {
      promptSistema = `Aja como tutor. Explique didaticamente cada questão. JSON: {"1": {"res": "A", "exp": "..."}}`;
    }

    const responseIA = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modeloEscolhido,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: promptSistema },
            { type: "image_url", image_url: { url: img } }
          ]
        }],
        response_format: { type: "json_object" },
        temperature: 0
      })
    });

    const data = await responseIA.json();
    const resultadoBruto = JSON.parse(data.choices[0].message.content);

    // ... (restante da sua lógica de nota e resposta igual ao anterior)
    return Response.json({ modo, resultado: resultadoBruto, modeloUsado: modeloEscolhido });

  } catch (error) {
    return Response.json({ erro: error.message }, { status: 500 });
  }
}
