// Fix: 'ContentPart' is not an exported member of '@google/genai'. Use 'Content' instead.
import { GoogleGenAI, Modality, GenerateContentResponse, Content, Type as GoogleAIType } from '@google/genai';
import { Agent, UserProfile, Message, AgentId, Analysis } from '../types';
import { ALL_AGENTS_MAP, SUPER_BOSS } from '../constants';
import { decode, createWavBlob } from '../utils/audioUtils';

let ai: GoogleGenAI;
const getAi = () => {
    if (!ai) {
        // Fix: Per coding guidelines, the API key must be retrieved from `process.env.API_KEY`.
        // This also resolves the TypeScript error "Property 'env' does not exist on type 'ImportMeta'".
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API_KEY environment variable not set. Please check your project configuration.");
        }
        ai = new GoogleGenAI({ apiKey: apiKey });
    }
    return ai;
};


const profileToContext = (profile: UserProfile): string => {
    return `Contexto do Usuário e da Empresa:
- Nome do Usuário: ${profile.userName}
- Cargo do Usuário: ${profile.userRole}
- Nome da Empresa: ${profile.companyName}
- Ramo de Atuação: ${profile.companyField}
- Porte da Empresa: ${profile.companySize}
- Tempo de Mercado: ${profile.companyStage}
- Principal Produto/Serviço: ${profile.mainProduct}
- Público-Alvo: ${profile.targetAudience}
- Principal Desafio Atual: ${profile.mainChallenge}`;
};

export const generateChatResponse = async (
    agent: Agent,
    profile: UserProfile,
    history: Message[],
    newMessage: string,
    image?: { data: string, mimeType: string },
    isDelegated: boolean = false
): Promise<{ text: string, imageUrl?: string }> => {
    const aiInstance = getAi();
    const systemInstruction = `${agent.systemInstruction}\n${profileToContext(profile)}`;

    if (agent.id === 'bi_analise') {
        const model = 'gemini-2.5-flash';
        const result = await aiInstance.models.generateContent({
            model: model,
            contents: newMessage,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json'
            },
        });

        const responseText = result.text.trim();
        try {
            const parsed = JSON.parse(responseText);
            if (parsed.analysis && parsed.chartData) {
                // It's a chart response!
                const chartPrompt = `Crie um gráfico de negócios limpo e profissional do tipo '${parsed.chartData.type}' com o título '${parsed.chartData.title}'. Os dados são: Rótulos do eixo X: [${parsed.chartData.labels.join(', ')}]. Valores do eixo Y: [${parsed.chartData.values.join(', ')}]. Garanta que todos os textos e números sejam claros, legíveis e não se sobreponham.`;
                const imageUrl = await generateVisualForReport(chartPrompt);
                return { text: parsed.analysis, imageUrl };
            }
        } catch (e) {
            // Not a chart, just regular text.
        }
        return { text: responseText }; // Fallback to text if parsing fails or structure is wrong
    }
    
    // Logic for Vitor (Creative Agent)
    if (agent.id === 'cri_visual' && agent.canHandleImages) {
        // If there's an image input, it's an EDIT task.
        if (image) {
             const model = 'gemini-2.5-flash-image';
             const response = await aiInstance.models.generateContent({
                model: model,
                contents: {
                    parts: [
                        { inlineData: { data: image.data, mimeType: image.mimeType } },
                        { text: newMessage },
                    ]
                },
                config: { responseModalities: [Modality.IMAGE] },
            });
            
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                    return { text: "Aqui está a imagem com as alterações solicitadas.", imageUrl };
                }
            }
            return { text: "Não consegui editar a imagem. Tente novamente." };
        } 
        // If there's NO image input, it's a CREATE task.
        else {
            const model = 'imagen-4.0-generate-001';
            const response = await aiInstance.models.generateImages({
                model: model,
                prompt: newMessage,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/png'
                }
            });
            if (response.generatedImages && response.generatedImages.length > 0) {
                 const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                 const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                 return { text: "Criei esta imagem com base na sua descrição.", imageUrl };
            }
            return { text: "Não consegui gerar a imagem. Tente descrever de outra forma." };
        }
    }
    
    // Default logic for other agents
    const model = 'gemini-2.5-flash';

    if (isDelegated) {
        const response = await aiInstance.models.generateContent({
            model: model,
            contents: newMessage,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return { text: response.text };
    }

    const contents: Content[] = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: newMessage }] });

    const chat = aiInstance.chats.create({ model, config: { systemInstruction }, history: contents.slice(0, -1) });
    const response = await chat.sendMessage({ message: newMessage });

    return { text: response.text };
};

export const generateSuperBossAnalysis = async (profile: UserProfile, history: Message[], newProblem: string): Promise<{ summary?: string, involvedAgentIds?: AgentId[], textResponse?: string }> => {
    const aiInstance = getAi();
    const model = 'gemini-2.5-flash';
    const systemInstruction = `${SUPER_BOSS.systemInstruction}\nLista de Agentes Disponíveis:\n${Object.values(ALL_AGENTS_MAP).filter(a => a.id !== 'super_boss').map(a => `- ${a.name} (id: ${a.id}): ${a.specialty}`).join('\n')}\n\n${profileToContext(profile)}`;

    const contents: Content[] = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: newProblem }] });

    const chat = aiInstance.chats.create({ model, config: { systemInstruction }, history: contents.slice(0, -1) });
    const result = await chat.sendMessage({ message: newProblem });

    const responseText = result.text.trim();
    
    // Try to parse as JSON first
    try {
        // Clean potential markdown code block fences
        const cleanJson = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
        const parsed = JSON.parse(cleanJson);
        if (parsed.summary && parsed.involved_agents) {
            return {
                summary: parsed.summary,
                involvedAgentIds: parsed.involved_agents,
            };
        }
    } catch (e) {
        // Not JSON, treat as a regular text response
    }
    
    return { textResponse: responseText };
};


export const generateSpeech = async (text: string, voice: string = 'Zephyr'): Promise<string> => {
    const aiInstance = getAi();
    const model = "gemini-2.5-flash-preview-tts";
    const response = await aiInstance.models.generateContent({
        model: model,
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received from API.");
    }
    
    const audioBytes = decode(base64Audio);
    const blob = createWavBlob(audioBytes);
    return URL.createObjectURL(blob);
};

export const generatePdfReportContent = async (analysis: Analysis, userProfile: UserProfile): Promise<{ rewrittenProblem: string; rewrittenSolutions: { agentId: AgentId; rewrittenSolution: string; visualPrompt?: string; visualTitle?: string; }[] }> => {
    const aiInstance = getAi();
    const model = 'gemini-2.5-pro';

    const prompt = `
        **TAREFA:** Você é um Consultor de Negócios Sênior. Sua tarefa é reescrever uma análise técnica de IA para um relatório executivo em PDF. O público-alvo são empresários e C-Levels, então a linguagem deve ser profissional, direta, estratégica e livre de jargões técnicos.

        **CONTEXTO DA EMPRESA:**
        ${profileToContext(userProfile)}

        **ANÁLISE TÉCNICA ORIGINAL:**
        - **Problema:** ${analysis.problem}
        - **Soluções dos Especialistas:**
        ${analysis.solutions.map(s => `  - **${s.agent.name} (ID: ${s.agent.id})**: ${s.solution}`).join('\n')}

        **SUA SAÍDA DEVE SER UM OBJETO JSON VÁLIDO COM A SEGUINTE ESTRUTURA, E NADA MAIS:**
        {
          "rewrittenProblem": "Um resumo executivo claro e conciso do problema, em 1-2 parágrafos, com linguagem de negócios.",
          "rewrittenSolutions": [
            {
              "agentId": "id_do_agente_original",
              "rewrittenSolution": "Reescreva a solução do especialista como um plano de ação prático e acionável. Use títulos em negrito com dois pontos (ex: **Título da Estratégia:**) e bullet points (*) para detalhar os passos. A linguagem deve ser clara e focada nos benefícios para o negócio.",
              "visualPrompt": "CRIE um prompt de texto para o modelo de imagem 'Imagen' para gerar um gráfico ou ilustração que represente VISUALMENTE esta solução. O visual deve ser limpo, profissional e fácil de entender. Ex: 'Um gráfico de funil de marketing profissional com as etapas: Topo, Meio, Fundo, mostrando a conversão de 1000 visitantes para 50 clientes.'. Se a solução for muito abstrata para um visual, retorne uma string vazia.",
              "visualTitle": "CRIE um título descritivo e conciso para a ilustração gerada pelo 'visualPrompt'. Ex: 'Funil de Marketing Digital Sugerido'."
            }
          ]
        }
    `;

    const response = await aiInstance.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        },
    });

    const cleanJson = response.text.trim().replace(/^```json\n/, '').replace(/\n```$/, '');
    return JSON.parse(cleanJson);
};


export const generateVisualForReport = async (prompt: string): Promise<string> => {
    const aiInstance = getAi();
    const model = 'imagen-4.0-generate-001';
    
    const response = await aiInstance.models.generateImages({
        model: model,
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png'
        }
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    }
    
    throw new Error("Failed to generate visual for report.");
};
