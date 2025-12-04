import { ensureChromeInstalled } from '../utils/chrome-installer.js';

/**
 * Web Scraper Service
 * Handles website scraping using Puppeteer
 */

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

class ScraperService {
  /**
   * Scrape a website and extract HTML and CSS
   * @param {string} url - URL to scrape
   * @returns {Promise<{html: string, styles: string}>}
   */
  async scrapeWebsite(url) {
    let browser = null;
    
    try {
      // Ensure Chrome is installed
      const chromeReady = await ensureChromeInstalled();
      if (!chromeReady) {
        throw new Error('Chrome browser not available. Please run: npx puppeteer browsers install chrome');
      }

      // Get appropriate Puppeteer instance
      const puppeteerInstance = isVercel 
        ? (await import('puppeteer-core')).default
        : (await import('puppeteer')).default;

      // Configure launch options
      const launchOptions = await this.getLaunchOptions(puppeteerInstance);
      
      // Launch browser
      browser = await this.launchBrowser(puppeteerInstance, launchOptions);
      
      // Scrape content
      const page = await browser.newPage();
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      const html = await page.content();
      const styles = await this.extractStyles(page);

      await browser.close();
      browser = null;

      return { html, styles };
    } catch (error) {
      // Clean up browser on error
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
      throw error;
    }
  }

  /**
   * Get launch options for Puppeteer
   */
  async getLaunchOptions(puppeteerInstance) {
    if (isVercel) {
      const chromium = await import('@sparticuz/chromium');
      const chromiumModule = chromium.default;
      
      if (typeof chromiumModule.setFonts === 'function') {
        chromiumModule.setFonts();
      }
      
      const executablePath = await chromiumModule.executablePath();
      if (!executablePath) {
        throw new Error('Failed to get Chromium executable path');
      }

      return {
        args: [
          ...(chromiumModule.args || []),
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-software-rasterizer',
        ],
        defaultViewport: chromiumModule.defaultViewport || { width: 1280, height: 720 },
        executablePath,
        headless: chromiumModule.headless !== false,
      };
    } else {
      const launchOptions = {
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

      // Try to get executable path
      try {
        const executablePath = puppeteerInstance.executablePath();
        const fs = await import('fs');
        if (executablePath && fs.existsSync(executablePath)) {
          launchOptions.executablePath = executablePath;
        }
      } catch (e) {
        // Use default
      }

      return launchOptions;
    }
  }

  /**
   * Launch browser with fallback
   */
  async launchBrowser(puppeteerInstance, launchOptions) {
    try {
      return await puppeteerInstance.launch(launchOptions);
    } catch (error) {
      // If launch fails and we have executablePath, try without it
      if (!isVercel && launchOptions.executablePath) {
        console.log('Launch failed with executablePath, trying without it...');
        delete launchOptions.executablePath;
        return await puppeteerInstance.launch(launchOptions);
      }
      throw error;
    }
  }

  /**
   * Extract all CSS styles from the page
   */
  async extractStyles(page) {
    return await page.evaluate(() => {
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
        }
      });

      // Also get inline styles
      const inlineStyles = Array.from(document.querySelectorAll('[style]'))
        .map((el) => el.getAttribute('style'))
        .join('\n');

      return allStyles + '\n' + inlineStyles;
    });
  }
}

export const scraperService = new ScraperService();

