export async function POST(req) {
  try {
    const body = await req.json();
    const { img, modo = "professor", gabaritoOficial = null } = body;

    if (!img) return Response.json({ erro: "Imagem necessária" }, { status: 400 });

    // Roteamento inteligente: Usa o modelo mais potente para Professor e Tutor
    const modelo = (modo === "tutor" || modo === "professor") ? "openai/gpt-4o" : "openai/gpt-4o-mini";

    let promptSistema = "";

    if (modo === "professor") {
      promptSistema = `Você é um Professor especialista elaborando um gabarito oficial.
      REGRA DE OURO: IGNORE COMPLETAMENTE qualquer marcação, risco, X ou letra gigante feita a caneta ou lápis pelo aluno. Resolva as questões do zero lendo o texto, a imagem e as alternativas com sua própria inteligência.
      
      PASSOS:
      1. Varra a imagem inteira e identifique TODAS as questões presentes (ex: 01, 02, 03, 04...).
      2. Escolha a alternativa correta para CADA UMA baseada apenas na lógica e no material de apoio da prova.
      
      Responda APENAS um JSON contendo TODAS as questões encontradas. 
      Exemplo: {"01": "C", "02": "C", "03": "D", "04": "D"}`;
    } 
    else if (modo === "fast") {
      promptSistema = `Você é um corretor visual. Sua ÚNICA função é olhar a imagem inteira e dizer o que o ALUNO marcou em TODAS as questões (seja com um X, um círculo, ou uma letra escrita por cima). Não tente resolver a questão.
      
      Varra a imagem inteira e responda APENAS um JSON com TODAS as questões encontradas. 
      Exemplo: {"01": "C", "02": "A", "03": "D", "04": "B"}`;
    } 
    else if (modo === "tutor") {
      promptSistema = `Aja como um Professor Tutor didático e encorajador. Sua missão é explicar o PORQUÊ da resposta estar correta para TODAS as questões da imagem.
      
      REGRAS:
      1. Varra a imagem e identifique TODAS as questões.
      2. Diga qual é a alternativa correta VERDADEIRA e explique o motivo citando o texto, a imagem ou regras gramaticais/fonéticas.
      3. Nunca se baseie nas respostas escritas à mão pelo aluno para dar a explicação.
      
      Responda APENAS um JSON contendo TODAS as questões. Exemplo: 
      {
        "01": {"res": "C", "exp": "Explicação da questão 1..."},
        "02": {"res": "A", "exp": "Explicação da questão 2..."}
      }`;
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
    if (!data.choices) throw new Error("IA não respondeu a tempo. Tente novamente.");
    
    const resultadoBruto = JSON.parse(data.choices[0].message.content);

    // Lógica para calcular a nota e cruzar dados no Modo Fast
    if (modo === "fast") {
      const gabaritoBase = gabaritoOficial || resultadoBruto;
      let acertos = 0;
      let total = 0;
      let detalhes = [];

      Object.keys(gabaritoBase).forEach(q => {
        total++;
        const correta = typeof gabaritoBase[q] === 'object' ? gabaritoBase[q].correta : gabaritoBase[q];
        const aluno = resultadoBruto[q] || "N/A";
        
        const status = (String(correta).toUpperCase() === String(aluno).toUpperCase());
        if (status) acertos++;
        
        detalhes.push({ q, correta, aluno, status });
      });

      const nota = total > 0 ? ((acertos / total) * 10).toFixed(1) : "0.0";
      return Response.json({ modo, nota, acertos, total, detalhes });
    }

    return Response.json({ modo, resultado: resultadoBruto });

  } catch (error) {
    console.error("Erro na API:", error);
    return Response.json({ erro: "Ocorreu um erro no processamento da imagem." }, { status: 500 });
  }
}
