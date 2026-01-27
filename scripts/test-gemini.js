import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyA0lj2g80r7KuI5ZVWsxdHqO8kwl0TzzsQ";
const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro",
    "gemini-pro"
  ];

  console.log("Iniciando teste de modelos...");

  for (const modelName of models) {
    console.log(`\nTestando: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Teste rápido. Responda 'OK'.");
      const response = await result.response;
      console.log(`✅ SUCESSO: ${modelName} respondeu: ${response.text()}`);
    } catch (error) {
      console.log(`❌ FALHA: ${modelName}`);
      console.log(`Erro: ${error.message}`);
    }
  }
}

testModels();