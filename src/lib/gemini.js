import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gen AI SDK
// Because we are using it directly in the frontend (Vite), we might need to handle CORS
// but for MVP purposes, we'll try initializing it directly.
const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export const askMedicalAI = async (prompt, patientContext) => {
  try {
    const systemInstruction = `You are the MedVault AI Assistant. You are a helpful, empathetic, and professional virtual health companion.
Context about the patient:
${patientContext}

Rules:
1. Always give a disclaimer that you are an AI and not a substitute for a professional doctor.
2. If asked about their records (like blood group or allergies), use the context provided.
3. Keep answers concise, readable, and well-structured using markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error('Failed to connect to the AI Assistant. Please try again.');
  }
};
