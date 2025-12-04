/**
 * HTML Property Extractor
 * Extracts CSS properties and metadata from scraped HTML
 */

export function extractPropertiesFromHtml(html, styles) {
  const extracted = {
    title: '',
    fontFamily: 'Arial, sans-serif',
    fontSize: '1em',
    padding: '20px',
    backgroundColor: '#ffffff',
    color: '#333',
  };

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    extracted.title = titleMatch[1].trim();
  } else {
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      extracted.title = h1Match[1].trim();
    }
  }

  // Extract styles from CSS string
  if (styles) {
    const bodyStyleMatch = styles.match(/body\s*\{[^}]*\}/i);
    if (bodyStyleMatch) {
      const bodyStyles = bodyStyleMatch[0];
      
      const fontFamilyMatch = bodyStyles.match(/font-family\s*:\s*([^;]+)/i);
      if (fontFamilyMatch) extracted.fontFamily = fontFamilyMatch[1].trim();

      const fontSizeMatch = bodyStyles.match(/font-size\s*:\s*([^;]+)/i);
      if (fontSizeMatch) extracted.fontSize = fontSizeMatch[1].trim();

      const paddingMatch = bodyStyles.match(/padding\s*:\s*([^;]+)/i);
      if (paddingMatch) extracted.padding = paddingMatch[1].trim();

      const backgroundColorMatch = bodyStyles.match(/background(?:-color)?\s*:\s*([^;]+)/i);
      if (backgroundColorMatch) extracted.backgroundColor = backgroundColorMatch[1].trim();

      const colorMatch = bodyStyles.match(/color\s*:\s*([^;]+)/i);
      if (colorMatch) extracted.color = colorMatch[1].trim();
    }

    // Check inline body styles
    const bodyTagMatch = html.match(/<body[^>]*style\s*=\s*["']([^"']+)["']/i);
    if (bodyTagMatch) {
      const inlineStyles = bodyTagMatch[1];
      
      const fontFamilyMatch = inlineStyles.match(/font-family\s*:\s*([^;]+)/i);
      if (fontFamilyMatch) extracted.fontFamily = fontFamilyMatch[1].trim();

      const fontSizeMatch = inlineStyles.match(/font-size\s*:\s*([^;]+)/i);
      if (fontSizeMatch) extracted.fontSize = fontSizeMatch[1].trim();

      const paddingMatch = inlineStyles.match(/padding\s*:\s*([^;]+)/i);
      if (paddingMatch) extracted.padding = paddingMatch[1].trim();

      const backgroundColorMatch = inlineStyles.match(/background(?:-color)?\s*:\s*([^;]+)/i);
      if (backgroundColorMatch) extracted.backgroundColor = backgroundColorMatch[1].trim();

      const colorMatch = inlineStyles.match(/color\s*:\s*([^;]+)/i);
      if (colorMatch) extracted.color = colorMatch[1].trim();
    }
  }

  return extracted;
}

/**
 * Create fallback HTML when AI generation fails
 */
export function createFallbackHtml(extractedProps, variantName, subdomain, styleConfig) {
  const pageTitle = extractedProps.title || `${variantName} - ${subdomain}`;
  
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: ${styleConfig.font};
            padding: ${extractedProps.padding};
            background: ${styleConfig.bg};
            color: ${styleConfig.text};
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: ${styleConfig.accent};
            padding: 30px;
            border-radius: 8px;
        }
        h1 { 
            font-size: ${extractedProps.fontSize}; 
            margin: 20px 0; 
            color: ${styleConfig.text};
        }
        p { line-height: 1.6; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${variantName} Design</h1>
        <p>This is a fallback variant generated due to API limitations.</p>
        <p>Original content would appear here after successful AI generation.</p>
    </div>
</body>
</html>`;
}

