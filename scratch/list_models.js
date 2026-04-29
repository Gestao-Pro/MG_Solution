import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const result = await genAI.listModels();
    console.log('Modelos disponíveis:');
    result.models.forEach(model => {
      console.log(`- ${model.name}`);
    });
  } catch (error) {
    console.error('Erro ao listar modelos:', error.message);
  }
}

listModels();
