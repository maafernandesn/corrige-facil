export async function POST(req) {
  try {
    const body = await req.json();
    const { img, modo = "professor", gabaritoOficial = null } = body;

    if (!img) return Response.json({ erro: "Imagem necessária" }, { status: 400 });

    const modelo = "openai/gpt-4o"; // Mantemos o potente para evitar erros de visão

    let promptSistema = "";

    if (modo === "professor") {
      promptSistema = `Você é um Professor Especialista. Sua tarefa é criar o GABARITO OFICIAL.
      1. IGNORE qualquer marcação de aluno. Resolva a prova do zero.
      2. Identifique TODAS as questões da imagem, não importa o formato (múltipla escolha, verdadeiro/falso, etc).
      3. Se a questão não tiver letras (A,B,C), use números ou identifique o padrão.
      Responda APENAS JSON: {"01": "A", "02": "B", ...}`;
    } 
    
    else if (modo === "fast") {
      promptSistema = `Você é um Inspetor Visual de Alta Precisão. 
      Sua tarefa é identificar o que o ALUNO MARCOU.
      
      CRITÉRIO DE ANALISE:
      1. Procure por um X, círculo ou rasura clara em cima de uma alternativa.
      2. IMPORTANTE: Se a questão não tiver NENHUMA marcação clara do aluno, responda "EM BRANCO".
      3. Ignore desenhos ou letras grandes fora das alternativas.
      
      Gabarito de referência: ${JSON.stringify(gabaritoOficial)}.
      Responda APENAS JSON: {"01": "C", "02": "EM BRANCO", ...}`;
    } 
    
    else if (modo === "tutor") {
      promptSistema = `Aja como um Tutor Pedagógico. 
      Explique as respostas com base neste GABARITO: ${JSON.stringify(gabaritoOficial)}.
      Foque na explicação lógica e gramatical.
      Responda APENAS JSON: {"01": {"res": "A", "exp": "..."}, ...}`;
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
    const resultadoBruto = JSON.parse(data.choices[0].message.content);

    if (modo === "fast") {
      if (!gabaritoOficial) return Response.json({ erro: "Gere o gabarito no modo Professor primeiro!" }, { status: 400 });
      
      let acertos = 0;
      let detalhes = [];
      const questoes = Object.keys(gabaritoOficial);

      questoes.forEach(q => {
        const correta = gabaritoOficial[q];
        const aluno = resultadoBruto[q] || "EM BRANCO";
        
        // Só é acerto se não estiver em branco e for igual à correta
        const status = aluno !== "EM BRANCO" && String(correta).toUpperCase() === String(aluno).toUpperCase();
        if (status) acertos++;
        
        detalhes.push({ q, correta, aluno, status });
      });

      const nota = ((acertos / questoes.length) * 10).toFixed(1);
      return Response.json({ modo, nota, acertos, total: questoes.length, detalhes });
    }

    return Response.json({ modo, resultado: resultadoBruto });

  } catch (error) {
    return Response.json({ erro: "Erro ao processar imagem." }, { status: 500 });
  }
}
