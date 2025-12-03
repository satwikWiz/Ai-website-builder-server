import puppeteer from 'puppeteer';

export async function scrapeWebsite(req, res) {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Scraping website: ${url}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

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
    res.status(500).json({ 
      error: 'Failed to scrape website',
      message: error.message 
    });
  }
}



