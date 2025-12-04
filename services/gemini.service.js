import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

/**
 * Gemini AI Service
 * Handles all interactions with Google's Gemini API
 */

class GeminiService {
  constructor() {
    this.apiKey = config.gemini.apiKey;
    this.modelName = config.gemini.model;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = null;
    this.initialized = false;
    
    this.initialize();
  }
  
  /**
   * Initialize the Gemini model
   */
  async initialize() {
    try {
      this.model = this.genAI.getGenerativeModel({ model: this.modelName });
      this.initialized = true;
      console.log(`✅ Gemini model initialized: ${this.modelName}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to initialize Gemini model:`, error.message);
      this.initialized = false;
      return false;
    }
  }
  
  /**
   * Generate content using Gemini AI
   * @param {string} prompt - The prompt to send to the model
   * @returns {Promise<string>} - The generated text
   */
  async generateContent(prompt) {
    if (!this.initialized || !this.model) {
      throw new Error('Gemini model not initialized. Check your API key.');
    }
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      
      if (!response || typeof response.text !== 'function') {
        throw new Error('Invalid response from Gemini API');
      }
      
      const text = response.text().trim();
      
      if (!text || text.length === 0) {
        throw new Error('Empty response from Gemini API');
      }
      
      return text;
    } catch (error) {
      // Enhance error messages
      if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
        throw new Error('Invalid or expired API key. Please check your GEMINI_API_KEY.');
      }
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new Error(`Model ${this.modelName} not found. Your API key might not have access to this model.`);
      }
      if (error.message?.includes('quota') || error.message?.includes('Quota')) {
        throw new Error('API quota exceeded. Please check your usage limits.');
      }
      throw error;
    }
  }
  
  /**
   * Generate HTML variant from original HTML and styles
   * @param {string} html - Original HTML
   * @param {string} styles - Original CSS styles
   * @param {string} designDirection - Design direction prompt
   * @returns {Promise<string>} - Generated HTML
   */
  async generateVariant(html, styles, designDirection) {
    const prompt = `You are a web designer. I will provide you with HTML and CSS from a scraped website. 
Your task is to create a new version of this website with the following design direction:

${designDirection}

Original HTML:
${html.substring(0, 8000)}

Original Styles:
${styles?.substring(0, 3000) || 'No styles provided'}

Please return ONLY valid, complete HTML that represents a redesigned version of this website. 
Do not include any explanations, markdown, backticks, or code blocks - just raw HTML.
The HTML must include a complete document structure with DOCTYPE, head, and body tags.
Include all styles inline or in style tags within the head.`;

    const generatedHtml = await this.generateContent(prompt);
    
    // Clean up markdown code blocks if present
    let cleanHtml = generatedHtml.trim();
    if (cleanHtml.startsWith('```html')) {
      cleanHtml = cleanHtml.substring(7);
    } else if (cleanHtml.startsWith('```')) {
      cleanHtml = cleanHtml.substring(3);
    }
    if (cleanHtml.endsWith('```')) {
      cleanHtml = cleanHtml.substring(0, cleanHtml.length - 3);
    }
    
    return cleanHtml.trim();
  }
  
  /**
   * Check if the service is ready
   */
  isReady() {
    return this.initialized && this.model !== null;
  }
}

// Export singleton instance
export const geminiService = new GeminiService();

