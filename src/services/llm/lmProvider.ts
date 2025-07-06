
export interface LmModel {
    id: string;
    name: string;
    pricing?: {
        prompt: string;
        completion: string;
    };
    contextLength: number;
}

export interface LmProvider {
    /**
     * Fetch available models from the provider's API
     * @param apiKey API key for authentication
     * @returns Array of available models
     */
    fetchAvailableModels(apiKey: string): Promise<LmModel[]>;

    /**
     * Get the name of the provider
     * @returns Provider name
     */
    getProviderName(): string;

    /**
     * Send a request to the LLM
     * @param model Model identifier to use
     * @param prompt The input prompt to send to the model
     * @param apiKey API key for authentication 
     * @param options Additional options for the request (e.g., temperature, max tokens)  
     * @returns Response from the LLM as a string 
     */
     sendRequest(
        model: string,
        prompt: string,
        apiKey: string,
        options?: Record<string, any>
    ): Promise<string>;
  }