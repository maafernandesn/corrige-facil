export async function POST(req) {
  try {
    const body = await req.json();
    const { img, modo = "professor", gabaritoOficial = null } = body;

    if (!img) {
      return Response.json({ erro: "A imagem é obrigatória." }, { status: 400 });
    }

    // 🎯 CONFIGURAÇÃO DE PROMPTS ESPECÍFICOS
    let promptSistema = "";
    
    if (modo === "professor") {
      promptSistema = `Você é um gerador de gabaritos. Analise a prova e identifique a alternativa correta de cada questão. 
      Responda APENAS um JSON no formato: {"1": "A", "2": "C"}`;
    } 
    
    else if (modo === "fast") {
      // Se já temos o gabarito, a IA foca apenas em ler o que o aluno fez (mais precisão)
      if (gabaritoOficial) {
        promptSistema = `Você é um sensor óptico de correção. 
        Sua tarefa é identificar qual alternativa o aluno MARCOU (com X, círculo ou rasura) na imagem. 
        Ignore se a resposta está certa ou errada, apenas relate o que foi assinalado.
        Responda APENAS um JSON no formato: {"1": "A", "2": "B"}`;
      } else {
        // Se não tem gabarito, ela faz o trabalho duplo (economiza tempo do professor)
        promptSistema = `Você deve: 1. Resolver as questões da prova. 2. Identificar qual alternativa o aluno MARCOU na imagem.
        Responda APENAS um JSON no formato: {"1": {"correta": "A", "aluno": "B"}, "2": {"correta": "C", "aluno": "C"}}`;
      }
    } 
    
    else if (modo === "tutor") {
      promptSistema = `Você é um tutor didático. Para cada questão na imagem, identifique a resposta correta e dê uma explicação curtíssima (máximo 2 frases) do porquê aquela é a resposta.
      Responda APENAS um JSON no formato: {"1": {"res": "A", "exp": "..."}, "2": {"res": "B", "exp": "..."}}`;
    }

    // 🚀 CHAMADA OTIMIZADA PARA OPENROUTER
    const responseIA = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // Alta performance com baixo custo
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
        temperature: 0 // Precisão máxima, sem "criatividade"
      })
    });

    const data = await responseIA.json();
    if (data.error) throw new Error(data.error.message);

    const resultadoBruto = JSON.parse(data.choices[0].message.content);

    // 📊 PÓS-PROCESSAMENTO PARA O MODO FAST (CÁLCULO DE NOTA)
    if (modo === "fast") {
      let acertos = 0;
      let total = 0;
      let detalhes = [];

      // Se o gabarito veio de fora (professor já tinha salvo)
      if (gabaritoOficial) {
        Object.keys(gabaritoOficial).forEach(q => {
          total++;
          const correta = gabaritoOficial[q];
          const aluno = resultadoBruto[q] || "N/A";
          const status = correta === aluno;
          if (status) acertos++;
          detalhes.push({ q, correta, aluno, status });
        });
      } else {
        // Se a IA gerou tudo na hora
        Object.keys(resultadoBruto).forEach(q => {
          total++;
          const { correta, aluno } = resultadoBruto[q];
          const status = correta === aluno;
          if (status) acertos++;
          detalhes.push({ q, correta, aluno, status });
        });
      }

      const nota = total > 0 ? ((acertos / total) * 10).toFixed(1) : 0;
      return Response.json({ modo, nota, acertos, total, detalhes });
    }

    // Retorno padrão para modo Professor ou Tutor
    return Response.json({ modo, resultado: resultadoBruto });

  } catch (error) {
    console.error("Erro no Route:", error);
    return Response.json({ erro: "Falha na análise", detalhe: error.message }, { status: 500 });
  }
}
