const prompt = gabarito
  ? `Você é um corretor de provas.

Analise a imagem:
- Identifique cada questão
- Identifique a alternativa marcada

Gabarito: ${gabarito}

Responda EXATAMENTE assim:

Questão 1 - Correta ou Errada
Questão 2 - Correta ou Errada
...

No final:
Nota final: X`
  : `Você é um leitor de provas.

Analise a imagem:
- Identifique cada questão
- Identifique a alternativa marcada (A, B, C ou D)

Responda assim:
Questão 1 - Alternativa: X
Questão 2 - Alternativa: X`;