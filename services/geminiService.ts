
import { GoogleGenAI, Type } from "@google/genai";

// Always use named parameter and direct access to process.env.API_KEY as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSecurityTip = async (lang: string = 'en') => {
  const languageNames: Record<string, string> = {
    'en': 'English',
    'vi': 'Vietnamese',
    'zh': 'Chinese'
  };
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a short, punchy, and actionable cyber security tip for a user managing their digital vault. Max 20 words. Please provide the response in ${languageNames[lang]}.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });
    // Extracting text output from GenerateContentResponse via .text property (not a method).
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    const defaults: Record<string, string> = {
      'en': "Keep your master password unique and enable 2FA for maximum security.",
      'vi': "Giữ mật khẩu chính của bạn là duy nhất và bật 2FA để bảo mật tối đa.",
      'zh': "保持主密码唯一，并启用双重身份验证（2FA）以获得最高安全性。"
    };
    return defaults[lang] || defaults['en'];
  }
};

export const checkPasswordStrengthAI = async (password: string) => {
  if (!password) return { strength: 0, feedback: "" };
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this password strength: "${password}". Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "0 to 100 score" },
            label: { type: Type.STRING, description: "Weak, Medium, Strong" },
            feedback: { type: Type.STRING, description: "One short sentence advice" }
          },
          required: ["score", "label", "feedback"]
        }
      }
    });
    // Extracting text output from GenerateContentResponse via .text property.
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { score: 40, label: "Medium", feedback: "Ensure a mix of symbols and cases." };
  }
};
