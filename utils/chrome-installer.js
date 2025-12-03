import { exec } from 'child_process';
import { promisify } from 'util';
import puppeteer from 'puppeteer';
import fs from 'fs';

const execAsync = promisify(exec);

/**
 * Check if Chrome is installed and install it if missing
 */
export async function ensureChromeInstalled() {
  try {
    // Check if Chrome executable exists
    const executablePath = puppeteer.executablePath();
    
    if (executablePath && fs.existsSync(executablePath)) {
      console.log('✓ Chrome found at:', executablePath);
      return true;
    }

    console.log('Chrome not found, attempting to install...');
    
    // Try to install Chrome
    try {
      await execAsync('npx puppeteer browsers install chrome', {
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      // Verify installation
      const newPath = puppeteer.executablePath();
      if (newPath && fs.existsSync(newPath)) {
        console.log('✓ Chrome installed successfully at:', newPath);
        return true;
      } else {
        console.warn('⚠ Chrome installation completed but executable not found');
        return false;
      }
    } catch (installError) {
      console.error('Failed to install Chrome:', installError.message);
      return false;
    }
  } catch (error) {
    console.error('Error checking Chrome installation:', error.message);
    return false;
  }
}

