
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Document } from "../types";

const MODEL_NAME = 'gemini-3-pro-preview';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async askAboutDocuments(
    query: string, 
    documents: Document[], 
    history: Message[]
  ): Promise<{ text: string; sources: string[] }> {
    const context = documents
      .map(doc => `--- DOCUMENT: ${doc.name} ---\n${doc.content}\n`)
      .join('\n');

    const systemInstruction = `
      You are an expert AI assistant designed to work like a "Notebook LLM". 
      Your primary goal is to answer user questions based ONLY on the provided documents.
      
      LANGUAGES: 
      - If the user asks in English, answer in English.
      - If the user asks in Arabic, answer in Arabic (using proper RTL formatting if applicable).
      - You are fluent in both.
      
      GUIDELINES:
      - If the answer is not in the documents, say "I couldn't find information about that in your documents." 
      - Provide citations using [Document Name] when you reference specific parts.
      - Be concise but thorough.
      - Maintain a professional, helpful tone.
      - If multiple documents are provided, synthesize information across them.
      
      CONTEXT DOCUMENTS:
      ${context}
    `;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          ...history.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: query }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.3, // Lower temperature for more factual retrieval
        },
      });

      const text = response.text || "Sorry, I couldn't generate a response.";
      
      // Basic heuristic to find which documents were mentioned in the text
      const mentionedSources = documents
        .filter(doc => text.includes(`[${doc.name}]`) || text.toLowerCase().includes(doc.name.toLowerCase()))
        .map(doc => doc.name);

      return {
        text,
        sources: Array.from(new Set(mentionedSources))
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async summarizeDocument(doc: Document): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Please provide a concise summary of this document: \n\n ${doc.content}`,
        config: {
          systemInstruction: "You are a helpful assistant that summarizes documents clearly. Use bullet points.",
        }
      });
      return response.text || "Summary unavailable.";
    } catch (error) {
      console.error("Summary Error:", error);
      return "Failed to generate summary.";
    }
  }
}

export const geminiService = new GeminiService();
