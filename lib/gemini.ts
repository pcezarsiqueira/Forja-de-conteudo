import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export const getGeminiModel = () => {
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not defined");
  }
  const genAI = new GoogleGenAI({ apiKey });
  return genAI;
};

async function safeGenerateContent(ai: any, params: any, maxRetries = 3) {
  let delay = 3000; // Start with 3s delay
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContent(params);
      if (!response || !response.text) {
        throw new Error("Empty response from Gemini API");
      }
      return response;
    } catch (error: any) {
      const isRetryableError = 
        error.message?.includes("429") || 
        error.message?.includes("RESOURCE_EXHAUSTED") ||
        error.status === "RESOURCE_EXHAUSTED" ||
        error.message?.includes("500") ||
        error.message?.includes("Internal Server Error") ||
        error.message?.includes("Empty response");

      if (isRetryableError && i < maxRetries - 1) {
        console.warn(`Gemini API error, retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      console.error("Gemini API Final Failure:", error);
      throw error;
    }
  }
  throw new Error("Max retries exceeded for Gemini API");
}

function parseJSONResponse(text: string | undefined) {
  if (!text) return {};
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON response:", text, e);
    return {};
  }
}

export async function classifyContent(content: string) {
  const ai = getGeminiModel();
  
  const prompt = `
    Analise a seguinte ideia/história: "${content}"
    
    Classifique-a nos seguintes eixos:
    1. Funil de marketing (Topo, Meio ou Fundo).
    2. Tipo de Conteúdo (Semente, Dor/Medo, Crença/Visão, Transformacional, Produto).
    3. Pontuação de viralização (0 a 100).
    4. Sugestão de combinação estratégica.
    
    Retorne um JSON:
    {
      "funnel": "Topo" | "Meio" | "Fundo",
      "contentType": "Semente" | "Dor/Medo" | "Crença/Visão" | "Transformacional" | "Produto",
      "viralScore": number,
      "viralAnalysis": "Explicação breve",
      "mergeSuggestion": "Sugestão de combinação"
    }
  `;

  const response = await safeGenerateContent(ai, {
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          funnel: { type: Type.STRING },
          contentType: { type: Type.STRING },
          viralScore: { type: Type.INTEGER },
          viralAnalysis: { type: Type.STRING },
          mergeSuggestion: { type: Type.STRING }
        },
        required: ["funnel", "contentType", "viralScore", "viralAnalysis", "mergeSuggestion"]
      }
    }
  });

  return parseJSONResponse(response.text);
}

export async function bulkClassify(items: { id: any, title: string, content: string }[]) {
  const ai = getGeminiModel();
  
  const itemsList = items.map(item => `ID: ${item.id} | Título: ${item.title} | Conteúdo: ${item.content}`).join('\n');
  
  const prompt = `
    Analise a seguinte lista de ideias e histórias do "Mindrop":
    
    ${itemsList}
    
    Sua tarefa é:
    1. Identificar quais dessas ideias estão PRONTAS para serem gravadas imediatamente (Produção).
    2. Para cada ideia, defina o Funil (Topo, Meio, Fundo) e o Tipo de Conteúdo (Semente, Dor/Medo, Crença/Visão, Transformacional, Produto).
    3. Justifique brevemente por que as selecionadas são as melhores para gravação agora.
    
    Retorne um JSON:
    {
      "recommendations": [
        {
          "id": any,
          "funnel": "Topo" | "Meio" | "Fundo",
          "contentType": "Semente" | "Dor/Medo" | "Crença/Visão" | "Transformacional" | "Produto",
          "readyToRecord": boolean,
          "reason": "Por que gravar agora?"
        }
      ],
      "summary": "Uma visão geral estratégica do baú"
    }
  `;

  const response = await safeGenerateContent(ai, {
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                funnel: { type: Type.STRING },
                contentType: { type: Type.STRING },
                readyToRecord: { type: Type.BOOLEAN },
                reason: { type: Type.STRING }
              },
              required: ["id", "funnel", "contentType", "readyToRecord", "reason"]
            }
          },
          summary: { type: Type.STRING }
        },
        required: ["recommendations", "summary"]
      }
    }
  });

  return parseJSONResponse(response.text);
}

export async function criticalAnalysis(content: string) {
  const ai = getGeminiModel();
  
  const prompt = `
    Realize uma análise crítica profunda da seguinte ideia: "${content}"
    
    Considere os seguintes pilares:
    1. Assunto: Do que se trata exatamente?
    2. Nicho: Qual o nicho específico de atuação?
    3. Mercado: Como está o mercado para este tipo de conteúdo?
    4. Temas Relacionados: Quais temas a pessoa que fala sobre isso geralmente já aborda ou deveria abordar?
    
    Retorne um JSON:
    {
      "subject": "Descrição do assunto",
      "niche": "Definição do nicho",
      "market": "Análise de mercado",
      "themes": ["tema 1", "tema 2", "tema 3"]
    }
  `;

  const response = await safeGenerateContent(ai, {
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          niche: { type: Type.STRING },
          market: { type: Type.STRING },
          themes: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["subject", "niche", "market", "themes"]
      }
    }
  });

  return parseJSONResponse(response.text);
}

export async function evaluateForScript(content: string) {
  const ai = getGeminiModel();
  
  const prompt = `
    Realize uma Varredura IA (S3 SEISO) nesta ideia: "${content}"
    
    Analise dois aspectos principais:
    1. Clareza Estratégica: O quão bem a ideia comunica seu propósito.
    2. Maturidade Psicológica: O quão bem ela atinge o subconsciente do público.
    
    Para cada aspecto, forneça um score (0-100) e uma análise do que já tem e do que precisa.
    
    Retorne um JSON:
    {
      "clarity": {
        "score": number,
        "title": "Título curto (ex: FACILITAR A ACEITAÇÃO...)",
        "analysis": "Estratégia prática e o que falta"
      },
      "psychology": {
        "score": number,
        "title": "Título curto (ex: EXPLICAR O MECANISMO...)",
        "analysis": "Impacto das mensagens e o que falta"
      },
      "refinedContent": "Versão polida da ideia"
    }
  `;

  const response = await safeGenerateContent(ai, {
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          clarity: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              title: { type: Type.STRING },
              analysis: { type: Type.STRING }
            },
            required: ["score", "title", "analysis"]
          },
          psychology: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              title: { type: Type.STRING },
              analysis: { type: Type.STRING }
            },
            required: ["score", "title", "analysis"]
          },
          refinedContent: { type: Type.STRING }
        },
        required: ["clarity", "psychology", "refinedContent"]
      }
    }
  });

  return parseJSONResponse(response.text);
}

export async function generateFullScript(content: string, hook: string, format: string, humorStyle: string) {
  const ai = getGeminiModel();
  
  const prompt = `
    Baseado na ideia refinada: "${content}"
    E no gancho selecionado: "${hook}"
    Para o formato: "${format}"
    Estilo de Humor/Tom: "${humorStyle}"
    
    Crie um roteiro completo e pronto para gravação. 
    O roteiro deve ser natural, persuasivo e manter a voz do criador, seguindo estritamente o tom "${humorStyle}".
    Inclua indicações de entonação e pausas se necessário.
    
    Retorne um JSON:
    {
      "fullScript": "O texto completo do roteiro aqui",
      "productionNotes": "Dicas de cenário, iluminação ou edição para este roteiro específico"
    }
  `;

  const response = await safeGenerateContent(ai, {
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fullScript: { type: Type.STRING },
          productionNotes: { type: Type.STRING }
        },
        required: ["fullScript", "productionNotes"]
      }
    }
  });

  return parseJSONResponse(response.text);
}

export async function generateScripts(content: string, humorStyle: string) {
  const ai = getGeminiModel();
  
  const prompt = `
    Crie roteiros baseados nesta ideia refinada: "${content}"
    Estilo de Humor/Tom desejado: "${humorStyle}"
    
    Gere 4 tipos de roteiros (Curto, Médio, Longo, YouTube).
    Para cada um, inclua:
    1. Ganchos Magnéticos (3 opções impactantes seguindo o tom "${humorStyle}").
    2. Corpo do Conteúdo (5 passos lógicos incluindo CTA).
    3. Visuals/Direção.
    
    Retorne um JSON:
    {
      "short": { 
        "hooks": ["gancho 1", "gancho 2", "gancho 3"],
        "steps": ["passo 1", "passo 2", "passo 3", "passo 4", "passo 5"],
        "visuals": "descrição visual"
      },
      "medium": { 
        "hooks": ["gancho 1", "gancho 2", "gancho 3"],
        "steps": ["passo 1", "passo 2", "passo 3", "passo 4", "passo 5"],
        "visuals": "descrição visual"
      },
      "long": { 
        "hooks": ["gancho 1", "gancho 2", "gancho 3"],
        "steps": ["passo 1", "passo 2", "passo 3", "passo 4", "passo 5"],
        "visuals": "descrição visual"
      },
      "youtube": { 
        "hooks": ["gancho 1", "gancho 2", "gancho 3"],
        "steps": ["passo 1", "passo 2", "passo 3", "passo 4", "passo 5"],
        "visuals": "descrição visual"
      }
    }
  `;

  const response = await safeGenerateContent(ai, {
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          short: { 
            type: Type.OBJECT, 
            properties: { 
              hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              visuals: { type: Type.STRING } 
            } 
          },
          medium: { 
            type: Type.OBJECT, 
            properties: { 
              hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              visuals: { type: Type.STRING } 
            } 
          },
          long: { 
            type: Type.OBJECT, 
            properties: { 
              hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              visuals: { type: Type.STRING } 
            } 
          },
          youtube: { 
            type: Type.OBJECT, 
            properties: { 
              hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              visuals: { type: Type.STRING } 
            } 
          }
        },
        required: ["short", "medium", "long", "youtube"]
      }
    }
  });

  return parseJSONResponse(response.text);
}

export async function generateVisualHook(script: string) {
  const ai = getGeminiModel();
  const prompt = `
    Baseado no roteiro: "${script}"
    Proponha 3 opções de "Ganchos Visuais" (o que deve aparecer na tela nos primeiros 3 segundos para prender a atenção).
    Pense em quebra de padrão, objetos inusitados, movimentos de câmera ou edições rápidas.
    
    Retorne um JSON:
    {
      "visualHooks": [
        { "title": "Título do Gancho", "description": "Descrição detalhada da ação visual" }
      ]
    }
  `;

  const response = await safeGenerateContent(ai, {
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visualHooks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["title", "description"]
            }
          }
        },
        required: ["visualHooks"]
      }
    }
  });
  return parseJSONResponse(response.text);
}

export async function generateStoryboard(script: string) {
  const ai = getGeminiModel();
  const prompt = `
    Crie um Storyboard viciante para o seguinte roteiro: "${script}"
    Divida o vídeo em cenas curtas (2-5 segundos cada).
    Para cada cena, descreva:
    1. O que acontece visualmente (Ação).
    2. O que é dito (Áudio).
    3. Sugestão de edição (Corte, Zoom, Texto na tela).
    
    Retorne um JSON:
    {
      "scenes": [
        { "time": "00:00 - 00:03", "action": "...", "audio": "...", "edit": "..." }
      ]
    }
  `;

  const response = await safeGenerateContent(ai, {
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                action: { type: Type.STRING },
                audio: { type: Type.STRING },
                edit: { type: Type.STRING }
              },
              required: ["time", "action", "audio", "edit"]
            }
          }
        },
        required: ["scenes"]
      }
    }
  });
  return parseJSONResponse(response.text);
}
