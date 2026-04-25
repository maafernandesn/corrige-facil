export async function POST(req) {
  try {
    const body = await req.json();
    const { img, modo = "professor", gabaritoOficial = null } = body;

    if (!img) return Response.json({ erro: "Imagem necessária" }, { status: 400 });

    // --- LOGICA DE ROTEAMENTO DE MODELOS ---
    // Forçamos o GPT-4o (potente) para o Tutor e para o Professor garantir o gabarito
    const modelo = (modo === "tutor" || modo === "professor") ? "openai/gpt-4o" : "openai/gpt-4o-mini";

    let promptSistema = "";

    if (modo === "professor") {
      promptSistema = `Aja como um Professor de Português. Analise a imagem e identifique a alternativa correta.
      Questão 1 é fonética: 'Cenoura' tem som de /s/, logo a resposta deve ter o mesmo som.
      Responda APENAS JSON: {"1": "C", "2": "C", "3": "D", "4": "D"}`;
    } 
    else if (modo === "fast") {
      promptSistema = `Aja como um scanner. O que o aluno MARCOU na imagem? (X ou círculo).
      Responda APENAS JSON: {"1": "C", "2": "C", "3": "D", "4": "D"}`;
    } 
    else if (modo === "tutor") {
      promptSistema = `Aja como Tutor. Explique por que a alternativa correta é a que o professor escolheu.
      Exemplo Questão 1: 'Cenoura' e 'Macio' possuem o 'C' com som de /s/. 
      Responda APENAS JSON: {"1": {"res": "C", "exp": "Explicação..."}, "2": {"res": "C", "exp": "..."}}`;
    }

    const resIA = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelo,
        messages: [{ role: "user", content: [{ type: "text", text: promptSistema }, { type: "image_url", image_url: { url: img } }] }],
        response_format: { type: "json_object" },
        temperature: 0
      })
    });

    const data = await resIA.json();
    if (!data.choices) throw new Error("IA não respondeu a tempo");
    
    const resultadoBruto = JSON.parse(data.choices[0].message.content);

    // --- CORREÇÃO DO TRAVAMENTO DO MODO FAST ---
    if (modo === "fast") {
      const gabaritoBase = gabaritoOficial || resultadoBruto;
      let acertos = 0;
      let total = 0;
      let detalhes = [];

      // Garantimos que percorremos as chaves corretamente
      Object.keys(gabaritoBase).forEach(q => {
        total++;
        const correta = typeof gabaritoBase[q] === 'object' ? gabaritoBase[q].correta : gabaritoBase[q];
        const aluno = resultadoBruto[q] || "N/A"; // Se a IA não viu a marcação, não trava
        
        const status = (String(correta).toUpperCase() === String(aluno).toUpperCase());
        if (status) acertos++;
        
        detalhes.push({ q, correta, aluno, status });
      });

      const nota = total > 0 ? ((acertos / total) * 10).toFixed(1) : "0.0";
      return Response.json({ modo, nota, acertos, total, detalhes });
    }

    return Response.json({ modo, resultado: resultadoBruto });

  } catch (error) {
    console.error("Erro Crítico:", error);
    return Response.json({ erro: "Ocorreu um erro no processamento", detalhe: error.message }, { status: 500 });
  }
}
