// src/api.js

/**
 * Sends a prompt to the backend to communicate with Gemini.
 * @param {string} text - User input or trigger text.
 * @param {string} systemInstruction - Optional system instruction for the AI persona.
 * @returns {Promise<Object>} - The JSON response from the AI.
 */
export async function callGemini(text, systemInstruction = "") {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text }] }],
                systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API Call Failed:", error);
        throw error;
    }
}
