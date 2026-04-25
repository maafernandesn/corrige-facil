export async function POST(req) {
  try {
    const body = await req.json();
    const { img, modo = "professor", gabaritoOficial = null } = body;

    if (!img) return Response.json({ erro: "Imagem obrigatória" }, { status: 400 });

    // 🧠 PROMPTS REFORMULADOS PARA ALTA PRECISÃO
    let promptSistema = "";
    
    if (modo === "professor") {
      promptSistema = `Aja como um professor de Língua Portuguesa rigoroso. 
      Sua tarefa é gerar um gabarito INFALÍVEL.
      PASSOS:
      1. Leia o enunciado e as alternativas com atenção.
      2. Se houver um texto, localize o trecho exato que responde à questão.
      3. Se for fonética (sons de letras), compare os sons um por um antes de decidir.
      4. Responda APENAS um JSON: {"1": "A", "2": "C"}`;
    } 
    
    else if (modo === "fast") {
      promptSistema = `Você é um fiscal de correção. 
      Sua tarefa é olhar a imagem e identificar APENAS o que o aluno marcou (X, círculo ou rasura).
      Não tente resolver a questão, apenas relate o que você VÊ na marcação do aluno.
      Responda APENAS um JSON: {"1": "A", "2": "B"}`;
    } 
    
    else if (modo === "tutor") {
      promptSistema = `Você é um tutor pedagógico detalhista. 
      Para cada questão:
      1. Analise o texto de apoio para garantir a resposta correta.
      2. No caso de fonética, explique o som das letras (ex: 'C' com som de /s/ ou /k/).
      3. Seja claro e não invente informações. Se o texto diz 'peixes', não diga 'camarões'.
      Responda APENAS um JSON: {"1": {"res": "A", "exp": "..."}, "2": {"res": "B", "exp": "..."}}`;
    }

    const responseIA = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", 
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: promptSistema },
              { type: "image_url", image_url: { url: img } }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0 // Mantém a resposta fria e baseada em fatos
      })
    });

    const data = await responseIA.json();
    if (data.error) throw new Error(data.error.message);

    const resultadoBruto = JSON.parse(data.choices[0].message.content);

    // Lógica de cálculo de nota (Modo Fast)
    if (modo === "fast") {
      let acertos = 0;
      let total = 0;
      let detalhes = [];
      const gabaritoFinal = gabaritoOficial || resultadoBruto;

      Object.keys(gabaritoFinal).forEach(q => {
        total++;
        // Se a IA retornar objeto (no caso de fast sem gabarito prévio) ou string
        const correta = typeof gabaritoFinal[q] === 'object' ? gabaritoFinal[q].correta : gabaritoFinal[q];
        const aluno = typeof resultadoBruto[q] === 'object' ? resultadoBruto[q].aluno : resultadoBruto[q];
        
        const status = correta === aluno;
        if (status) acertos++;
        detalhes.push({ q, correta, aluno, status });
      });

      const nota = total > 0 ? ((acertos / total) * 10).toFixed(1) : 0;
      return Response.json({ modo, nota, acertos, total, detalhes });
    }

    return Response.json({ modo, resultado: resultadoBruto });

  } catch (error) {
    return Response.json({ erro: error.message }, { status: 500 });
  }
}
