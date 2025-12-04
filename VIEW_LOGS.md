# How to See Console Logs

## The Problem
Your server is running, but you can't see the console logs. This usually means the server is running in a different terminal window.

## Solution 1: Find the Running Terminal

The server is running in terminal session `s003`. Look for a terminal window that shows:
- `nodemon index.js` or `npm run dev`
- `Server running on port 3001`

That's where your logs will appear!

## Solution 2: Restart Server in Current Terminal

If you can't find that terminal, restart the server in your current terminal:

1. **Stop the current server:**
   ```bash
   # Find and kill the process
   pkill -f "nodemon index.js"
   # OR
   kill 32176
   ```

2. **Start server in your current terminal:**
   ```bash
   cd wizhack/server
   npm run dev
   ```

Now you'll see all logs in this terminal!

## Solution 3: Check Server Logs via API Response

If you can't access the terminal, the API response includes debug info:

```json
{
  "success": true,
  "variants": [...],
  "debug": {
    "apiKeyConfigured": true,
    "modelInitialized": true,
    "generationErrors": [...]
  }
}
```

## Solution 4: Use a Log File

Add logging to a file by modifying `index.js`:

```javascript
import fs from 'fs';

// Add this after imports
const logFile = fs.createWriteStream('server.log', { flags: 'a' });
const originalLog = console.log;
console.log = (...args) => {
  originalLog(...args);
  logFile.write(args.join(' ') + '\n');
};
```

Then view logs with:
```bash
tail -f server.log
```

## Quick Check: Is Server Running?

Run this to see if server is responding:
```bash
curl http://localhost:3001/
```

Should return: `Hello World`

