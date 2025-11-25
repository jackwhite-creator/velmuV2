import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const MODEL_NAME = "gemini-2.0-flash";
const API_KEY = process.env.GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);

// Configuration de sécurité pour être moins strict (utile pour un chatbot)
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export const AIService = {
  async getChatCompletion(userQuestion: string): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
        systemInstruction: "Tu es un assistant serviable et amical nommé Velmu AI, intégré dans une application de chat. Tes réponses doivent être concises, directes et utiles, formatées en Markdown simple. Évite les salutations redondantes."
      });

      const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: userQuestion }] }],
          safetySettings,
      });

      const response = result.response;
      return response.text();

    } catch (error: any) {
      console.error("❌ ERREUR DÉTAILLÉE DE L'API GEMINI :");
      // L'erreur de Gemini est souvent dans error.message
      console.error(error.message);
      return "Désolé, une erreur est survenue lors de la communication avec le service d'IA.";
    }
  },
};