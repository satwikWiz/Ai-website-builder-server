# Gemini API Setup Guide

## Quick Fix for "Fallback" Issue

If you're seeing fallback HTML instead of AI-generated content, follow these steps:

### 1. Create `.env` file

Create a `.env` file in the `server/` directory:

```bash
cd server
touch .env
```

### 2. Add your Gemini API Key

Open `.env` and add:

```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=3001
```

**Get your API key from:** https://makersuite.google.com/app/apikey

### 3. Test the API Key

Run the test script to verify your API key works:

```bash
node test-gemini.js
```

You should see:
- ✅ API Key found
- ✅ Model initialized
- ✅ SUCCESS! Gemini API is working!

If you see errors, the script will tell you what's wrong.

### 4. Restart Your Server

After setting up the `.env` file, restart your server:

```bash
npm run dev
# or
npm start
```

### 5. Check Console Logs

When you make a request, you should see detailed logs like:

```
🔑 Gemini API Key Status: { hasKey: true, keyLength: 39, ... }
✅ Gemini model initialized successfully
🚀 Generating variant 1 for subdomain: example
✅ Variant 1 generated successfully (5000 chars)
```

### 6. Check API Response

If fallback is still used, the API response will include a `debug` object:

```json
{
  "success": true,
  "variants": [...],
  "warning": "Some variants were generated using fallback HTML...",
  "debug": {
    "apiKeyConfigured": true,
    "apiKeyLength": 39,
    "modelInitialized": true,
    "generationErrors": [...]
  }
}
```

## Common Issues

### Issue: "API_KEY" error
**Solution:** Your API key is invalid or expired. Get a new one from Google AI Studio.

### Issue: "Quota" error
**Solution:** You've exceeded your free tier quota. Wait or upgrade your plan.

### Issue: "Permission" error
**Solution:** Check that your API key has the right permissions in Google Cloud Console.

### Issue: No console logs visible
**Solution:** 
- Make sure you're running the server in a terminal (not backgrounded)
- Check that `console.log` isn't being filtered
- Try running: `npm run dev` to see real-time logs

## Still Having Issues?

1. Run `node test-gemini.js` to test your API key
2. Check the server console for detailed error messages
3. Look at the API response `debug` object for error details
4. Make sure your `.env` file is in the `server/` directory
5. Restart the server after changing `.env`

