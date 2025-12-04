# Server Documentation

## 🏗️ Architecture

The server is built with a clean, modular architecture:

```
server/
├── config/           # Configuration files
│   └── env.js       # Environment variable validation
├── middleware/       # Express middleware
│   ├── logger.js    # Request logging
│   └── errorHandler.js # Error handling
├── services/        # Business logic services
│   ├── gemini.service.js  # Gemini AI integration
│   └── scraper.service.js # Web scraping
├── routes/          # API route handlers
│   ├── scrape.route.js
│   └── variants.route.js
├── utils/           # Utility functions
│   ├── html-extractor.js
│   ├── elements-converter.js
│   └── chrome-installer.js
├── prisma/          # Database schema
└── index.js         # Main entry point
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
GEMINI_API_KEY="your_gemini_api_key_here"

# Optional
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*
GEMINI_MODEL=gemini-2.5-flash
```

### 3. Set Up Database

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## 📡 API Endpoints

### Scrape Website
```
POST /api/scrape
Body: { url: string }
Response: { success: boolean, html: string, styles: string, url: string }
```

### Generate Variants
```
POST /api/variants/generate
Body: { html: string, styles: string, subdomain: string }
Response: { success: boolean, variants: Array, debug: Object }
```

### Get Variants
```
GET /api/variants/:subdomain
Response: { success: boolean, variants: Array }
```

### Get Variant
```
GET /api/variant/:variantId
Response: { success: boolean, variant: Object }
```

### Save Variant
```
PUT /api/variant/:variantId
Body: { elements: Array }
Response: { success: boolean, variant: Object }
```

## 🔧 Key Features

### 1. **Environment Validation**
- Validates all required environment variables on startup
- Provides clear error messages for missing variables

### 2. **Request Logging**
- Every request gets a unique ID
- Logs request method, path, body, and response time
- Easy to track requests across the system

### 3. **Error Handling**
- Centralized error handling middleware
- Consistent error response format
- User-friendly error messages
- Debug info in development mode

### 4. **Gemini Service**
- Singleton service for Gemini AI
- Automatic model initialization
- Better error messages
- Ready state checking

### 5. **Scraper Service**
- Handles both Vercel and local environments
- Automatic Chrome installation check
- Better error handling

## 🐛 Debugging

### Check Logs
All requests are logged with:
- Request ID
- Method and path
- Request body preview
- Response status and timing

### API Response Debug Info
Every variant generation response includes a `debug` object:
```json
{
  "debug": {
    "requestId": "1234567890-abc123",
    "geminiReady": true,
    "useFallback": false,
    "errorDetails": null,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Common Issues

**1. Gemini API not working:**
- Check `GEMINI_API_KEY` in `.env`
- Verify API key is valid
- Check model name is correct

**2. Chrome not found:**
- Run: `npx puppeteer browsers install chrome`
- Check Chrome installation

**3. Database errors:**
- Verify `DATABASE_URL` is correct
- Run: `npx prisma migrate dev`

## 📝 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key |
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `CORS_ORIGIN` | No | `*` | CORS allowed origins |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name |

## 🧪 Testing

Test Gemini API:
```bash
node test-gemini.js
```

Test variants generation:
```bash
node test-variants.js
```

## 📦 Dependencies

- **express** - Web framework
- **@google/generative-ai** - Gemini AI SDK
- **@prisma/client** - Database ORM
- **puppeteer** - Web scraping
- **cors** - CORS middleware
- **dotenv** - Environment variables

