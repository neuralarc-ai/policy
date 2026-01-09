// Configuration for the Document Comparison Tool

export interface AppConfig {
  gemini: {
    apiKey?: string;
    enabled: boolean;
    model: string;
    rateLimit: {
      requestsPerMinute: number;
      batchSize: number;
      batchDelayMs: number;
    };
  };
  comparison: {
    useCaching: boolean;
    cacheTTL: number; // in milliseconds
    enableDebugLogging: boolean;
  };
  ui: {
    showAIStatus: boolean;
    showMatchingSource: boolean;
  };
}

// Environment-based configuration
export const config: AppConfig = {
  gemini: {
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    enabled: process.env.NEXT_PUBLIC_ENABLE_GEMINI === 'true',
    model: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-pro',
    rateLimit: {
      requestsPerMinute: parseInt(process.env.NEXT_PUBLIC_GEMINI_RPM || '60'),
      batchSize: parseInt(process.env.NEXT_PUBLIC_GEMINI_BATCH_SIZE || '5'),
      batchDelayMs: parseInt(process.env.NEXT_PUBLIC_GEMINI_DELAY || '200')
    }
  },
  comparison: {
    useCaching: process.env.NEXT_PUBLIC_USE_CACHING !== 'false', // default true
    cacheTTL: parseInt(process.env.NEXT_PUBLIC_CACHE_TTL || '3600000'), // 1 hour
    enableDebugLogging: process.env.NODE_ENV === 'development'
  },
  ui: {
    showAIStatus: process.env.NEXT_PUBLIC_SHOW_AI_STATUS === 'true',
    showMatchingSource: process.env.NODE_ENV === 'development'
  }
};

// Validation function
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.gemini.enabled && !config.gemini.apiKey) {
    errors.push('NEXT_PUBLIC_GEMINI_API_KEY is required when Gemini is enabled');
  }
  
  if (config.gemini.rateLimit.requestsPerMinute < 1) {
    errors.push('Rate limit must be at least 1 request per minute');
  }
  
  if (config.comparison.cacheTTL < 0) {
    errors.push('Cache TTL must be non-negative');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Helper function to get safe config values
export function getGeminiConfig() {
  return {
    ...config.gemini,
    apiKey: config.gemini.apiKey ? '***CONFIGURED***' : undefined
  };
}
