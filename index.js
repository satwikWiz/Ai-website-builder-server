import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { scrapeWebsite } from './routes/scrape.js';
import { generateVariants, getVariants, getVariant, saveVariant } from './routes/variants.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json({ limit: '50mb' }));

// Routes
app.post('/api/scrape', scrapeWebsite);
app.post('/api/variants/generate', generateVariants);
app.get('/api/variants/:subdomain', getVariants);
app.get('/api/variant/:variantId', getVariant);
app.put('/api/variant/:variantId', saveVariant);

app.get('/', (req, res) => {
  res.send('Hello World');
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

