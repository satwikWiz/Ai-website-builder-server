import 'dotenv/config';

/**
 * Environment Configuration
 * Validates and exports all environment variables
 */

const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};

const optionalEnvVars = {
  PORT: process.env.PORT || '3001',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

// Validate required environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach((key) => console.error(`   - ${key}`));
  console.error('\nPlease create a .env file with these variables.');
  process.exit(1);
}

// Validate API key format
if (requiredEnvVars.GEMINI_API_KEY && requiredEnvVars.GEMINI_API_KEY.length < 20) {
  console.warn('⚠️  WARNING: GEMINI_API_KEY seems invalid (too short)');
}

export const config = {
  port: parseInt(optionalEnvVars.PORT, 10),
  nodeEnv: optionalEnvVars.NODE_ENV,
  corsOrigin: optionalEnvVars.CORS_ORIGIN,
  database: {
    url: requiredEnvVars.DATABASE_URL,
  },
  gemini: {
    apiKey: requiredEnvVars.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },
  isDevelopment: optionalEnvVars.NODE_ENV === 'development',
  isProduction: optionalEnvVars.NODE_ENV === 'production',
};

console.log('✅ Environment configuration loaded');
console.log(`   Port: ${config.port}`);
console.log(`   Environment: ${config.nodeEnv}`);
console.log(`   Gemini API Key: ${config.gemini.apiKey ? '✅ Set' : '❌ Missing'}`);
console.log(`   Gemini Model: ${config.gemini.model}`);

