import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { ensureChromeInstalled } from './utils/chrome-installer.js';

// Import routes
import { scrapeWebsite } from './routes/scrape.route.js';
import { 
  generateVariants, 
  getVariants, 
  getVariant, 
  saveVariant 
} from './routes/variants.route.js';

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.post('/api/scrape', scrapeWebsite);
app.post('/api/variants/generate', generateVariants);
app.get('/api/variants/:subdomain', getVariants);
app.get('/api/variant/:variantId', getVariant);
app.put('/api/variant/:variantId', saveVariant);

// 404 Handler
app.use(notFoundHandler);

// Error Handler (must be last)
app.use(errorHandler);

// Initialize Chrome and start server
async function startServer() {
  try {
    // Check Chrome installation
    const chromeReady = await ensureChromeInstalled();
    if (chromeReady) {
      console.log('✓ Chrome browser ready');
    } else {
      console.warn('⚠ Chrome browser not available. Scraping may fail.');
      console.warn('  Run manually: npx puppeteer browsers install chrome');
    }

    // Start server
    app.listen(config.port, () => {
      console.log('\n' + '='.repeat(60));
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   Gemini Model: ${config.gemini.model}`);
      console.log('='.repeat(60) + '\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
