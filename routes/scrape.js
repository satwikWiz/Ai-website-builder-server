import { ensureChromeInstalled } from '../utils/chrome-installer.js';

// Check if running on Vercel
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

export async function scrapeWebsite(req, res) {
  let browser;
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Ensure Chrome is installed before scraping
    const chromeReady = await ensureChromeInstalled();
    if (!chromeReady) {
      return res.status(500).json({
        error: 'Chrome browser not available',
        message: 'Chrome browser is not installed. Please run: npx puppeteer browsers install chrome'
      });
    }

    console.log(`Scraping website: ${url}`);

    // Launch browser with better configuration for different environments
    let launchOptions;
    let puppeteerInstance;

    // For Vercel, use @sparticuz/chromium with puppeteer-core
    if (isVercel) {
      console.log('Running on Vercel, using @sparticuz/chromium');
      puppeteerInstance = (await import('puppeteer-core')).default;
      
      // Dynamically import chromium only when needed (on Vercel)
      const chromium = await import('@sparticuz/chromium');
      const executablePath = await chromium.default.executablePath();
      if (!executablePath) {
        throw new Error('Failed to get Chromium executable path from @sparticuz/chromium');
      }

      launchOptions = {
        args: [...chromium.default.args, '--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: chromium.default.defaultViewport,
        executablePath: executablePath,
        headless: chromium.default.headless,
      };
    } else {
      // For local/other environments, use regular Puppeteer Chrome
      puppeteerInstance = (await import('puppeteer')).default;
      
      launchOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      };

      // Try to get the executable path for local Puppeteer
      try {
        const executablePath = puppeteerInstance.executablePath();
        // Check if the file actually exists
        const fs = await import('fs');
        if (executablePath && fs.existsSync(executablePath)) {
          launchOptions.executablePath = executablePath;
          console.log('Using Chrome at:', executablePath);
        } else {
          console.log('Chrome not found at expected path, Puppeteer will use default');
        }
      } catch (e) {
        console.log('Could not get executable path, Puppeteer will use default');
      }
    }

    // Try to launch browser
    try {
      browser = await puppeteerInstance.launch(launchOptions);
    } catch (launchError) {
      // If launch fails and we're not on Vercel, try without explicit executablePath
      if (!isVercel && launchOptions.executablePath) {
        console.log('Launch failed with executablePath, trying without it...');
        delete launchOptions.executablePath;
        browser = await puppeteerInstance.launch(launchOptions);
      } else {
        throw launchError;
      }
    }

    const page = await browser.newPage();
    
    // Set a reasonable timeout
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Get HTML content
    const html = await page.content();

    // Extract styles
    const styles = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      let allStyles = '';

      styleSheets.forEach((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach((rule) => {
            allStyles += rule.cssText + '\n';
          });
        } catch (e) {
          // Cross-origin stylesheets may throw errors
          console.warn('Could not access stylesheet:', e);
        }
      });

      // Also get inline styles
      const inlineStyles = Array.from(document.querySelectorAll('[style]'))
        .map((el) => el.getAttribute('style'))
        .join('\n');

      return allStyles + '\n' + inlineStyles;
    });

    await browser.close();

    res.json({
      success: true,
      html,
      styles,
      url,
    });
  } catch (error) {
    console.error('Scraping error:', error);
    
    // Clean up browser if it was created
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }

    // Provide helpful error message
    let errorMessage = error.message;
    if (errorMessage.includes('Could not find Chrome') || errorMessage.includes('Browser was not found')) {
      errorMessage = 'Chrome browser not found. Please run: npx puppeteer browsers install chrome. If deploying, ensure Chrome is installed in your deployment environment.';
    }

    res.status(500).json({ 
      error: 'Failed to scrape website',
      message: errorMessage 
    });
  }
}



