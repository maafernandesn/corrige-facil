export async function POST(req) {
  try {
    const body = await req.json();
    const { img, modo = "professor", gabaritoOficial = null } = body;

    if (!img) return Response.json({ erro: "Imagem necessária" }, { status: 400 });

    // Usamos o GPT-4o (mais potente) para garantir precisão em fonética e interpretação
    const modelo = "openai/gpt-4o"; 

    let promptSistema = "";

    if (modo === "professor") {
      promptSistema = `Você é um Professor Especialista. Sua tarefa é criar o GABARITO OFICIAL da prova.
      1. IGNORE COMPLETAMENTE marcações manuais (X, círculos, letras grandes escritas pelo aluno).
      2. Resolva as questões do zero com base no texto, imagens e lógica.
      3. Verifique fonética com rigor (ex: 'C' com som de /s/ em 'Cenoura' é igual a 'Macio').
      4. Varra a imagem inteira para encontrar TODAS as questões.
      Responda APENAS JSON: {"01": "C", "02": "C", "03": "D", "04": "D"}`;
    } 
    
    else if (modo === "fast") {
      promptSistema = `Você é um Inspetor Visual. Sua ÚNICA tarefa é identificar o que o ALUNO MARCOU na imagem.
      Gabarito de referência (apenas para saber quais questões existem): ${JSON.stringify(gabaritoOficial)}.
      Não tente resolver as questões, apenas relate onde está o X ou o círculo do aluno.
      Responda APENAS JSON: {"01": "A", "02": "C", ...}`;
    } 
    
    else if (modo === "tutor") {
      promptSistema = `Aja como um Tutor Pedagógico didático. 
      Você DEVE explicar as respostas com base NESTE GABARITO: ${JSON.stringify(gabaritoOficial)}.
      Não discorde do gabarito. Explique o porquê de cada resposta ser a correta citando regras de português ou trechos do texto.
      Responda APENAS JSON: {"01": {"res": "C", "exp": "Explicação..."}, ...}`;
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
    if (!data.choices) throw new Error("A IA demorou para responder. Tente novamente.");
    
    const resultadoBruto = JSON.parse(data.choices[0].message.content);

    // Lógica de cruzamento para o Modo Fast
    if (modo === "fast") {
      if (!gabaritoOficial) return Response.json({ erro: "Gere o gabarito no modo Professor primeiro!" }, { status: 400 });
      
      let acertos = 0;
      let detalhes = [];
      const questoes = Object.keys(gabaritoOficial);

      questoes.forEach(q => {
        const correta = gabaritoOficial[q];
        const aluno = resultadoBruto[q] || "N/A";
        const status = String(correta).toUpperCase() === String(aluno).toUpperCase();
        if (status) acertos++;
        detalhes.push({ q, correta, aluno, status });
      });

      const nota = ((acertos / questoes.length) * 10).toFixed(1);
      return Response.json({ modo, nota, acertos, total: questoes.length, detalhes });
    }

    return Response.json({ modo, resultado: resultadoBruto });

  } catch (error) {
    console.error("Erro API:", error);
    return Response.json({ erro: "Erro ao processar imagem: " + error.message }, { status: 500 });
  }
}
