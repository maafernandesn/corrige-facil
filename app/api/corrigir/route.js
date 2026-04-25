export async function POST(req) {
  try {
    const body = await req.json();
    const { img, modo = "professor", gabaritoOficial = null } = body;

    if (!img) return Response.json({ erro: "Imagem necessária" }, { status: 400 });

    // Forçamos o modelo mais inteligente para evitar erros fonéticos básicos
    const modelo = "openai/gpt-4o"; 

    let promptSistema = "";

    if (modo === "professor") {
      promptSistema = `Aja como um Professor Rigoroso. 
      1. IGNORE marcações de alunos (X, círculos, riscos). 
      2. LEIA o texto 'Vida Saudável' e as alternativas com atenção extrema.
      3. Analise a fonética (ex: 'C' com som de /s/ em 'Cenoura' deve ser igual a 'Macio', não 'Recheio').
      4. Gere um gabarito incontestável.
      
      Responda APENAS um JSON: {"01": "C", "02": "C", "03": "D", "04": "D"}`;
    } 
    else if (modo === "fast") {
      // Aqui está o segredo: passamos o gabarito oficial para a IA não precisar "pensar", apenas "olhar" o aluno
      promptSistema = `Você é um conferencista de marcas. Sua ÚNICA tarefa é olhar para a imagem e identificar qual alternativa o ALUNO marcou (onde tem um X ou círculo). 
      
      Gabarito de referência (NÃO USE PARA CORRIGIR, APENAS PARA SABER QUAIS QUESTÕES EXISTEM): ${JSON.stringify(gabaritoOficial)}
      
      Responda APENAS um JSON com o que o ALUNO marcou: {"01": "C", "02": "A", ...}`;
    } 
    else if (modo === "tutor") {
      promptSistema = `Aja como um Tutor Didático. 
      Explique cada questão do gabarito fornecido: ${JSON.stringify(gabaritoOficial)}.
      Se o gabarito diz que 01 é C, explique por que C é a correta baseada no texto ou gramática. 
      
      Responda APENAS um JSON: {"01": {"res": "C", "exp": "Explicação..."}, ...}`;
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
        temperature: 0 // Temperatura 0 para evitar variações nas respostas
      })
    });

    const data = await resIA.json();
    const resultadoBruto = JSON.parse(data.choices[0].message.content);

    if (modo === "fast") {
      let acertos = 0;
      let total = 0;
      let detalhes = [];

      // Cruzamento de dados entre Gabarito do Professor vs Marcação do Aluno
      Object.keys(gabaritoOficial).forEach(q => {
        total++;
        const correta = gabaritoOficial[q];
        const aluno = resultadoBruto[q] || "N/A";
        
        const status = (String(correta).trim().toUpperCase() === String(aluno).trim().toUpperCase());
        if (status) acertos++;
        
        detalhes.push({ q, correta, aluno, status });
      });

      const nota = ((acertos / total) * 10).toFixed(1);
      return Response.json({ modo, nota, acertos, total, detalhes });
    }

    return Response.json({ modo, resultado: resultadoBruto });

  } catch (error) {
    return Response.json({ erro: "Erro ao processar prova." }, { status: 500 });
  }
}
