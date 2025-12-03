import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const GEMINI_API_KEY ='AIzaSyAPqRvmUG5pnd5zlG3mVkooCs64Zx1lFZQ';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Extract CSS properties from scraped HTML and styles
function extractPropertiesFromScrapedHtml(html, styles) {
    const extracted = {
        title: '',
        fontFamily: 'Arial, sans-serif',
        fontSize: '1em',
        padding: '20px',
        backgroundColor: '#ffffff',
        color: '#333',
    };


    console.log('Extracting properties from scraped HTML:', GEMINI_API_KEY);
    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
        extracted.title = titleMatch[1].trim();
    } else {
        // Fallback to first h1
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match) {
            extracted.title = h1Match[1].trim();
        }
    }

    // Extract body styles from styles string
    if (styles) {
        // Look for body { ... } styles
        const bodyStyleMatch = styles.match(/body\s*\{[^}]*\}/i);
        if (bodyStyleMatch) {
            const bodyStyles = bodyStyleMatch[0];

            // Extract font-family
            const fontFamilyMatch = bodyStyles.match(/font-family\s*:\s*([^;]+)/i);
            if (fontFamilyMatch) {
                extracted.fontFamily = fontFamilyMatch[1].trim();
            }

            // Extract font-size
            const fontSizeMatch = bodyStyles.match(/font-size\s*:\s*([^;]+)/i);
            if (fontSizeMatch) {
                extracted.fontSize = fontSizeMatch[1].trim();
            }

            // Extract padding
            const paddingMatch = bodyStyles.match(/padding\s*:\s*([^;]+)/i);
            if (paddingMatch) {
                extracted.padding = paddingMatch[1].trim();
            }

            // Extract background-color or background
            const backgroundColorMatch = bodyStyles.match(/background(?:-color)?\s*:\s*([^;]+)/i);
            if (backgroundColorMatch) {
                extracted.backgroundColor = backgroundColorMatch[1].trim();
            }

            // Extract color
            const colorMatch = bodyStyles.match(/color\s*:\s*([^;]+)/i);
            if (colorMatch) {
                extracted.color = colorMatch[1].trim();
            }
        }

        // Also check for inline body styles in HTML
        const bodyTagMatch = html.match(/<body[^>]*style\s*=\s*["']([^"']+)["']/i);
        if (bodyTagMatch) {
            const inlineStyles = bodyTagMatch[1];

            // Extract font-family from inline styles
            const fontFamilyMatch = inlineStyles.match(/font-family\s*:\s*([^;]+)/i);
            if (fontFamilyMatch) {
                extracted.fontFamily = fontFamilyMatch[1].trim();
            }

            // Extract font-size from inline styles
            const fontSizeMatch = inlineStyles.match(/font-size\s*:\s*([^;]+)/i);
            if (fontSizeMatch) {
                extracted.fontSize = fontSizeMatch[1].trim();
            }

            // Extract padding from inline styles
            const paddingMatch = inlineStyles.match(/padding\s*:\s*([^;]+)/i);
            if (paddingMatch) {
                extracted.padding = paddingMatch[1].trim();
            }

            // Extract background-color from inline styles
            const backgroundColorMatch = inlineStyles.match(/background(?:-color)?\s*:\s*([^;]+)/i);
            if (backgroundColorMatch) {
                extracted.backgroundColor = backgroundColorMatch[1].trim();
            }

            // Extract color from inline styles
            const colorMatch = inlineStyles.match(/color\s*:\s*([^;]+)/i);
            if (colorMatch) {
                extracted.color = colorMatch[1].trim();
            }
        }
    }

    return extracted;
}

// Convert HTML to editor elements structure
function convertHtmlToEditorElements(html) {
    // Parse HTML and convert to editor structure
    // For now, create a simple structure with the HTML as rich text
    return [
        {
            content: [
                {
                    content: { innerText: html },
                    id: uuidv4(),
                    name: 'RichText',
                    styles: {},
                    type: 'RichText',
                },
            ],
            id: '__body',
            name: 'Body',
            styles: {},
            type: '__body',
        },
    ];
}

export async function generateVariants(req, res) {
    try {
        const { html, styles, subdomain } = req.body;

        console.log('Generate variants request:', { 
            subdomain, 
            htmlLength: html?.length, 
            stylesLength: styles?.length 
        });

        if (!html || !subdomain) {
            return res.status(400).json({ error: 'HTML and subdomain are required' });
        }

        // Try to get a working Gemini model
        // Note: The API key may not have access to all models
        // Common working models: 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'
        let model;
        try {
            // Try gemini-1.5-flash first (fastest and most available)
            model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        } catch (e) {
            console.log('gemini-2.5-flash not available, trying alternatives...');
            // If that fails, the model will be null and we'll use fallback
            model = null;
        }

        // Create different style variants for different domains
        const variantPrompts = [
            'Create a modern, minimalist version of this website with clean lines and lots of white space. Focus on simplicity and elegance.',
            // 'Create a bold, vibrant version with bright colors, large typography, and dynamic layouts. Make it energetic and eye-catching.',
            'Create a professional, corporate version with a traditional layout, conservative colors, and structured content organization.',
            // 'Create a creative, artistic version with unique layouts, creative typography, and experimental design elements.',
        ];

        const variantNames = [
            'Modern Minimalist',
            // 'Bold Vibrant',
            'Professional Corporate',
            // 'Creative Artistic',
        ];

        // Determine which variant style to use based on domain name
        // This ensures each domain gets a different style
        const domainHash = subdomain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const variantIndex = domainHash % variantPrompts.length;

        const variants = [];

        // Extract properties from scraped HTML and styles
        const extractedProps = extractPropertiesFromScrapedHtml(html, styles);

        // Generate one variant with the style determined by domain
        for (let i = 0; i < 1; i++) {
            const styleIndex = variantIndex; // Use the domain-specific style index
            let generatedHtml = '';
            let useFallback = false;

            if (model) {
                try {
                    const prompt = `
You are a web designer. I will provide you with HTML and CSS from a scraped website. 
Your task is to create a new version of this website with the following design direction:

${variantPrompts[styleIndex]}

Original HTML:
${html.substring(0, 10000)}...

Original Styles:
${styles.substring(0, 5000)}...

Please return ONLY valid HTML that represents a redesigned version of this website. 
Do not include any explanations, markdown formatting, or code blocks - just the raw HTML.
The HTML should be complete and ready to use, including inline styles or style tags.
`;

                    console.log(`Generating variant ${i + 1} for subdomain: ${subdomain} with style: ${variantNames[styleIndex]}`);
                    
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    generatedHtml = response.text();
                    console.log(`Variant ${i + 1} generated successfully`);
                } catch (error) {
                    console.error(`Error generating variant ${i + 1}:`, error.message);
                    useFallback = true;
                }
            } else {
                console.log(`No Gemini model available, using fallback for variant ${i + 1}`);
                useFallback = true;
            }
            
            if (useFallback || !generatedHtml) {
                // Create a simple variant based on the original HTML with modifications
                // Apply different styles based on variant type
                const variantStyles = [
                    // Modern Minimalist - clean, simple
                    { bg: '#ffffff', text: '#333333', accent: '#f0f0f0', font: extractedProps.fontFamily || 'Arial, sans-serif' },
                    // Bold Vibrant - bright colors
                    // { bg: '#ff6b6b', text: '#ffffff', accent: '#ffd93d', font: extractedProps.fontFamily || 'Impact, sans-serif' },
                    // Professional Corporate - conservative
                    { bg: '#1a1a2e', text: '#eaeaea', accent: '#16213e', font: extractedProps.fontFamily || 'Georgia, serif' },
                    // Creative Artistic - unique
                    // { bg: '#667eea', text: '#ffffff', accent: '#764ba2', font: extractedProps.fontFamily || 'Comic Sans MS, cursive' },
                ];
                
                const style = variantStyles[styleIndex] || variantStyles[0];
                const pageTitle = extractedProps.title || `${variantNames[styleIndex]} - ${subdomain}`;
                generatedHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${pageTitle}</title>
    <style>
        body { 
            font-family: ${style.font};
            margin: 0;
            padding: ${extractedProps.padding};
            background: ${style.bg};
            color: ${style.text};
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: ${style.accent};
            padding: 30px;
            border-radius: 8px;
        }
        h1 { 
            font-size: ${extractedProps.fontSize}; 
            margin: 20px 0; 
            color: ${style.text};
        }
        p { line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${variantNames[styleIndex]} Design</h1>
        <p>This is a placeholder variant. The Gemini API needs to be configured with a valid API key and model name.</p>
        <p>Original content would appear here after successful AI generation.</p>
    </div>
</body>
</html>`;
            }

            // Clean up the HTML
            let cleanHtml = generatedHtml.trim();
            if (cleanHtml.startsWith('```html')) {
                cleanHtml = cleanHtml.replace(/```html\n?/g, '').replace(/```\n?$/g, '');
            } else if (cleanHtml.startsWith('```')) {
                cleanHtml = cleanHtml.replace(/```\n?/g, '').replace(/```$/g, '');
            }

            try {
                // Convert to editor elements structure
                const elements = convertHtmlToEditorElements(cleanHtml);

                // Save to database
                const variant = await prisma.variant.create({
                    data: {
                        subdomain,
                        variantNumber: 1,
                        html: cleanHtml,
                        elements: JSON.stringify(elements),
                        name: useFallback ? `${variantNames[styleIndex]} (Placeholder)` : variantNames[styleIndex],
                    },
                });

                console.log(`Variant ${i + 1} saved with ID: ${variant.id}`);

                variants.push({
                    id: variant.id,
                    variantNumber: variant.variantNumber,
                    name: variant.name,
                    html: variant.html,
                    elements: JSON.parse(variant.elements),
                });
            } catch (dbError) {
                console.error(`Failed to save variant ${i + 1}:`, dbError);
            }
        }

        console.log(`Generated ${variants.length} variants for subdomain: ${subdomain}`);
        
        res.json({
            success: true,
            variants,
            subdomain,
        });
    } catch (error) {
        console.error('Variant generation error:', error);
        res.status(500).json({
            error: 'Failed to generate variants',
            message: error.message,
        });
    }
}

export async function getVariants(req, res) {
    try {
        const { subdomain } = req.params;
        
        console.log('Getting variants for subdomain:', subdomain);

        if (!subdomain || subdomain === 'undefined') {
            return res.status(400).json({
                error: 'Invalid subdomain',
                subdomain: subdomain,
            });
        }

        const variants = await prisma.variant.findMany({
            where: { subdomain },
            orderBy: { variantNumber: 'asc' },
        });

        console.log(`Found ${variants.length} variants for subdomain: ${subdomain}`);

        res.json({
            success: true,
            variants: variants.map((v) => ({
                id: v.id,
                variantNumber: v.variantNumber,
                name: v.name,
                elements: JSON.parse(v.elements),
            })),
        });
    } catch (error) {
        console.error('Get variants error:', error);
        res.status(500).json({
            error: 'Failed to get variants',
            message: error.message,
        });
    }
}

export async function getVariant(req, res) {
    try {
        const { variantId } = req.params;

        const variant = await prisma.variant.findUnique({
            where: { id: variantId },
        });

        if (!variant) {
            return res.status(404).json({ error: 'Variant not found' });
        }

        res.json({
            success: true,
            variant: {
                id: variant.id,
                variantNumber: variant.variantNumber,
                name: variant.name,
                html: variant.html,
                elements: JSON.parse(variant.elements),
                subdomain: variant.subdomain,
            },
        });
    } catch (error) {
        console.error('Get variant error:', error);
        res.status(500).json({
            error: 'Failed to get variant',
            message: error.message,
        });
    }
}

export async function saveVariant(req, res) {
    try {
        const { variantId } = req.params;
        const { elements } = req.body;

        if (!elements) {
            return res.status(400).json({ error: 'Elements are required' });
        }

        const variant = await prisma.variant.update({
            where: { id: variantId },
            data: {
                elements: JSON.stringify(elements),
            },
        });

        res.json({
            success: true,
            variant: {
                id: variant.id,
                variantNumber: variant.variantNumber,
                name: variant.name,
                elements: JSON.parse(variant.elements),
            },
        });
    } catch (error) {
        console.error('Save variant error:', error);
        res.status(500).json({
            error: 'Failed to save variant',
            message: error.message,
        });
    }
}

