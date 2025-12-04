import { scraperService } from '../services/scraper.service.js';

/**
 * Scrape Website Route
 * POST /api/scrape
 */
export async function scrapeWebsite(req, res, next) {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    console.log(`[${req.requestId}] Scraping website: ${url}`);

    const { html, styles } = await scraperService.scrapeWebsite(url);

    res.json({
      success: true,
      html,
      styles,
      url,
    });
  } catch (error) {
    // Enhance error message for Chrome issues
    if (error.message?.includes('Chrome') || error.message?.includes('Browser')) {
      error.message = 'Chrome browser not found. Please run: npx puppeteer browsers install chrome';
    }
    next(error);
  }
}

