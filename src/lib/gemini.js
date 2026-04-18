import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gen AI SDK
// Because we are using it directly in the frontend (Vite), we might need to handle CORS
// but for MVP purposes, we'll try initializing it directly.
let aiInstance = null;

export const askMedicalAI = async (prompt, patientContext) => {
  try {
    if (!aiInstance) {
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error('Gemini API key is completely missing from Vercel settings.');
      }
      aiInstance = new GoogleGenAI({ 
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
      });
    }
    const systemInstruction = `You are the MedVault AI Assistant. You are a helpful, empathetic, and professional virtual health companion.
Context about the patient:
${patientContext}

Rules:
1. Always give a disclaimer that you are an AI and not a substitute for a professional doctor.
2. If asked about their records (like blood group or allergies), use the context provided.
3. Keep answers concise, readable, and well-structured using markdown.`;

    const response = await aiInstance.models.generateContent({
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

export const analyzeMedicalReport = async (base64Data, mimeType) => {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.warn('Gemini API key is completely missing. Using mock AI extraction for demo.');
      return {
        conditions: ["Hypertension (Mock Extracted)", "Type 2 Diabetes"],
        allergies: ["Penicillin (Mock)"],
        current_medications: ["Lisinopril 10mg (Mock)", "Metformin 500mg"]
      };
    }

    if (!aiInstance) {
      aiInstance = new GoogleGenAI({ 
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
      });
    }

    const systemInstruction = `You are a medical data extraction tool.
Analyze the provided medical report (image or document).
Extract the following information and return ONLY a valid JSON object with the exact keys:
{
  "conditions": ["List of diagnosed diseases, conditions, or chronic issues"],
  "allergies": ["List of any allergies mentioned"],
  "current_medications": ["List of medications and dosages prescribed or mentioned"]
}
If a field is not found in the document, return an empty array for that field.
Do not wrap the JSON in markdown code blocks, return raw JSON string.`;

    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        "Extract the medical data into the requested JSON format."
      ],
      config: {
        systemInstruction,
        temperature: 0.2,
      }
    });

    const text = response.text.trim();
    // In case it returns markdown block anyway
    const jsonStr = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error('Failed to analyze the report.');
  }
};
