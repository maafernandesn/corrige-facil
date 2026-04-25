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
      REGRA DE OURO: IGNORE COMPLETAMENTE qualquer marcação, risco, X ou letra gigante feita a caneta ou lápis pelo aluno. Resolva a questão do zero lendo o texto, a imagem e as alternativas com sua própria inteligência.
      
      PASSOS:
      1. Identifique o NÚMERO REAL da questão impresso na prova (ex: 12, 03, etc).
      2. Escolha a alternativa correta baseada apenas na lógica e no material de apoio da prova.
      
      Responda APENAS um JSON no formato {"numero_da_questao": "Letra_Correta"}. 
      Exemplo: {"12": "D"}`;
    } 
    else if (modo === "fast") {
      promptSistema = `Você é um corretor visual. Sua ÚNICA função é olhar a imagem e dizer o que o ALUNO marcou (seja com um X, um círculo, ou uma letra escrita por cima). Não tente resolver a questão.
      
      Responda APENAS um JSON no formato {"numero_da_questao": "Letra_Marcada_Pelo_Aluno"}. 
      Exemplo: {"12": "C"}`;
    } 
    else if (modo === "tutor") {
      promptSistema = `Aja como um Professor Tutor didático e encorajador. Sua missão é explicar o PORQUÊ da resposta estar correta.
      
      REGRAS:
      1. Identifique o número real da questão (ex: 12).
      2. Diga qual é a alternativa correta VERDADEIRA e explique o motivo citando o texto, a imagem ou regras gramaticais/fonéticas.
      3. Nunca se baseie nas respostas escritas à mão pelo aluno para dar a explicação.
      
      Responda APENAS um JSON. Exemplo: 
      {"12": {"res": "D", "exp": "A expressão CHOMP CHOMP é uma onomatopeia que representa o som de mastigação."}}`;
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
      // Se não houver gabarito prévio, usa o que a IA acabou de ler (fallback)
      const gabaritoBase = gabaritoOficial || resultadoBruto;
      let acertos = 0;
      let total = 0;
      let detalhes = [];

      Object.keys(gabaritoBase).forEach(q => {
        total++;
        const correta = typeof gabaritoBase[q] === 'object' ? gabaritoBase[q].correta : gabaritoBase[q];
        const aluno = resultadoBruto[q] || "N/A";
        
        // Compara ignorando maiúsculas/minúsculas
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
