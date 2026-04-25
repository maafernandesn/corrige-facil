export async function POST(req) {
  try {
    const body = await req.json();
    const { img, modo = "professor", gabaritoOficial = null } = body;

    if (!img) return Response.json({ erro: "Imagem necessária" }, { status: 400 });

    const modelo = "openai/gpt-4o"; 

    let promptSistema = "";

    if (modo === "professor") {
      promptSistema = `Aja como um Professor Especialista. 
      Sua tarefa é criar o GABARITO REAL da prova.
      1. IGNORE marcações de alunos (X, círculos, riscos ou letras escritas). 
      2. Identifique o número real de cada questão (ex: 08, 12).
      3. Resolva cada questão com base no texto e lógica pedagógica.
      Retorne APENAS JSON: {"08": "B", "12": "D"}`;
    } 
    
    else if (modo === "fast") {
      promptSistema = `Você é um Inspetor Visual de Marcas de Tinta.
      Sua ÚNICA função é verificar se o aluno fez alguma marcação (X, Círculo ou Rasura) nas alternativas.
      
      Gabarito de referência (use para saber os números das questões): ${JSON.stringify(gabaritoOficial)}.
      
      REGRAS CRÍTICAS:
      1. Se NÃO houver um X ou Círculo claro em uma alternativa, responda "EM BRANCO".
      2. Não tente "deduzir" a resposta pelo contexto. Se o papel está limpo naquela questão, é "EM BRANCO".
      3. Ignore letras grandes escritas à mão fora das bolinhas/letras.
      
      Retorne APENAS JSON: {"08": "EM BRANCO", "12": "B"}`;
    } 
    
    else if (modo === "tutor") {
      promptSistema = `Aja como um Tutor Pedagógico.
      Use este Gabarito Oficial como base absoluta: ${JSON.stringify(gabaritoOficial)}.
      Explique didaticamente por que cada resposta do gabarito está correta.
      Retorne APENAS JSON: {"08": {"res": "B", "exp": "..."}, "12": {"res": "D", "exp": "..."}}`;
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
      if (!gabaritoOficial) return Response.json({ erro: "Gere o gabarito primeiro!" }, { status: 400 });
      
      let acertos = 0;
      let detalhes = [];
      const questoes = Object.keys(gabaritoOficial);

      questoes.forEach(q => {
        const correta = gabaritoOficial[q];
        const aluno = resultadoBruto[q] || "EM BRANCO";
        const status = aluno !== "EM BRANCO" && String(correta).toUpperCase() === String(aluno).toUpperCase();
        if (status) acertos++;
        detalhes.push({ q, correta, aluno, status });
      });

      const nota = ((acertos / questoes.length) * 10).toFixed(1);
      return Response.json({ modo, nota, acertos, total: questoes.length, detalhes });
    }

    return Response.json({ modo, resultado: resultadoBruto });

  } catch (error) {
    return Response.json({ erro: "Erro no processamento visual." }, { status: 500 });
  }
}
