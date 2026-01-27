import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Carregar variáveis de ambiente do arquivo .env na raiz
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Erro: GEMINI_API_KEY não encontrada no .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Modelos para testar
const models = [
    'gemini-2.5-flash-image', 
    'gemini-2.0-flash-exp-image-generation'
];

async function testModel(modelName) {
    console.log(`\nTestando modelo: ${modelName}`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = "Generate a cute robot holding a banana, 3d render style.";

        console.log("Enviando prompt:", prompt);
        
        // Tentativa padrão via generateContent
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        console.log("Resposta completa:", JSON.stringify(response, null, 2));
        
        // Verificar se há imagens inline ou links
        // A resposta pode vir como texto (se o modelo recusar) ou ter partes especiais
        
    } catch (e) {
        console.error(`Erro com modelo ${modelName}:`, e.message);
        if (e.response) {
            console.error("Detalhes do erro:", JSON.stringify(e.response, null, 2));
        }
    }
}

async function run() {
    for (const m of models) {
        await testModel(m);
    }
}

run();
