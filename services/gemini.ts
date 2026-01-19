
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Document, Folder } from "../types";

const MODEL_NAME = 'gemini-3-pro-preview';

export class GeminiService {
  private ai: GoogleGenAI;

constructor() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key is missing (VITE_GEMINI_API_KEY)");
  }

  this.ai = new GoogleGenAI({ apiKey });
}


  async askAboutDocuments(
    query: string, 
    documents: Document[], 
    folders: Folder[],
    history: Message[],
    isAdmin: boolean
  ): Promise<{ text: string; sources: string[]; needsAdmin?: boolean }> {
    
    const confidentialId = 'confidential-dir';

    const context = documents
      .map(doc => {
        const isConfidential = doc.folderId === confidentialId;
        
        // STRICT: If not admin, the bot NEVER sees the content of confidential files.
        if (isConfidential && !isAdmin) {
          return `--- SOURCE: /sources/confidential/${doc.name} ---\n[SECURITY: LOCKED]\n[INFO: This file exists in the confidential directory. Content is hidden from the AI until Administrator Login is completed.]\n`;
        }
        
        const folderPath = isConfidential ? 'confidential' : 'general';
        return `--- SOURCE: /sources/${folderPath}/${doc.name} ---\n[SECURITY: UNLOCKED]\n[CONTENT]:\n${doc.content}\n`;
      })
      .join('\n');

    const systemInstruction = `
      You are the "Smart College Bot". You are an expert interface for a project directory.
      Your knowledge base is strictly limited to the provided sources in the /sources/ directory.

      STRICT SECURITY PROTOCOL:
      1. If a user asks a question that matches a file in the /sources/confidential/ directory while it is [LOCKED], you MUST NOT provide any information from it.
      2. In this case, you MUST respond with this EXACT phrase and NOTHING ELSE:
         "The information you are requesting is part of our confidential records. To view this data, please verify your administrator credentials."
         (Arabic: "المعلومات التي تطلبها هي جزء من سجلاتنا السرية. لعرض هذه البيانات ، يرجى التحقق من بيانات اعتماد المسؤول.")

      GENERAL RULES:
      - Answer in English or Arabic based on the user's language.
      - If you have access (UNLOCKED), answer fully and cite the source like [FileName].
      - If the query is general and not in the docs, politely explain you only know what's in the Smart College records.

      VIRTUAL PROJECT CONTEXT:
      ${context}
    `;

    try {
      const historyParts = history.slice(-6).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Use ai.models.generateContent directly with model name and contents.
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          ...historyParts,
          { role: 'user', parts: [{ text: query }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.0, 
        },
      });

      // Correctly access response.text property as per SDK guidelines.
      const text = response.text || "Connection failed.";
      const needsAdmin = text.toLowerCase().includes("administrator credentials") || 
                         text.includes("بيانات اعتماد المسؤول");
      
      const mentionedSources = documents
        .filter(doc => text.includes(`[${doc.name}]`) || text.toLowerCase().includes(doc.name.toLowerCase()))
        .map(doc => doc.name);

      return {
        text,
        sources: Array.from(new Set(mentionedSources)),
        needsAdmin
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
