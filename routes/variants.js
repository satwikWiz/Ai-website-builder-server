import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDwz0-F4rqaviL68fVly5rKliAxINdIq7Y';

// Log API key status (first 10 chars only for security)
console.log('🔑 Gemini API Key Status:', {
    hasKey: !!GEMINI_API_KEY,
    keyLength: GEMINI_API_KEY?.length || 0,
    keyPrefix: GEMINI_API_KEY?.substring(0, 10) || 'none',
    fromEnv: !!process.env.GEMINI_API_KEY
});

if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 20) {
    console.error('❌ WARNING: Invalid or missing GEMINI_API_KEY!');
    console.error('   Please set GEMINI_API_KEY in your .env file');
}

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

    console.log('Extracting properties from scraped HTML');
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
    const requestId = Date.now();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📥 [${requestId}] Generate Variants API Called`);
    console.log(`${'='.repeat(60)}`);
    
    try {
        const { html, styles, subdomain } = req.body;

        console.log(`[${requestId}] Request data:`, {
            subdomain,
            htmlLength: html?.length || 0,
            stylesLength: styles?.length || 0,
            hasHtml: !!html,
            hasStyles: !!styles
        });

        if (!html || !subdomain) {
            return res.status(400).json({ error: 'HTML and subdomain are required' });
        }

        // Initialize Gemini model
        let model;
        let modelError = null;
        try {
            model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            console.log('✅ Gemini model initialized: gemini-2.5-flash');
        } catch (e) {
            modelError = e;
            console.error('❌ Failed to initialize Gemini model:', e.message);
            model = null;
        }

        // Create different style variants for different domains
        const variantPrompts = [
            'Create a modern, minimalist version of this website with clean lines and lots of white space. Focus on simplicity and elegance.',
            'Create a professional, corporate version with a traditional layout, conservative colors, and structured content organization.',
        ];

        const variantNames = [
            'Modern Minimalist',
            'Professional Corporate',
        ];

        // Determine which variant style to use based on domain name
        const domainHash = subdomain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const variantIndex = domainHash % variantPrompts.length;

        const variants = [];

        // Extract properties from scraped HTML and styles
        const extractedProps = extractPropertiesFromScrapedHtml(html, styles);

        // Track errors for debugging
        const generationErrors = [];

        // Generate one variant with the style determined by domain
        for (let i = 0; i < 1; i++) {
            const styleIndex = variantIndex;
            let generatedHtml = '';
            let useFallback = false;
            let errorDetails = null;

            if (!model) {
                console.warn(`⚠️  No Gemini model available, using fallback for variant ${i + 1}`);
                if (modelError) {
                    console.warn(`   Reason: ${modelError.message}`);
                }
                useFallback = true;
            } else {
                console.log(`   ✅ Model is available, attempting generation...`);
                try {
                    const prompt = `You are a web designer. I will provide you with HTML and CSS from a scraped website. 
Your task is to create a new version of this website with the following design direction:

${variantPrompts[styleIndex]}

Original HTML:
${html.substring(0, 8000)}

Original Styles:
${styles?.substring(0, 3000) || 'No styles provided'}

Please return ONLY valid, complete HTML that represents a redesigned version of this website. 
Do not include any explanations, markdown, backticks, or code blocks - just raw HTML.
The HTML must include a complete document structure with DOCTYPE, head, and body tags.
Include all styles inline or in style tags within the head.`;

                    console.log(`🚀 Generating variant ${i + 1} for subdomain: ${subdomain} with style: ${variantNames[styleIndex]}`);
                    console.log(`   Prompt length: ${prompt.length} chars`);
                    console.log(`   HTML length: ${html.length} chars`);
                    console.log(`   Styles length: ${styles?.length || 0} chars`);
                    console.log(`   Calling Gemini API...`);

                    const result = await model.generateContent(prompt);
                    console.log(`   ✅ Got result from Gemini API`);
                    
                    const response = result.response;
                    console.log(`   ✅ Got response object`);
                    console.log(`   Response type: ${typeof response}`);
                    console.log(`   Response keys: ${Object.keys(response || {}).join(', ')}`);
                    
                    if (!response) {
                        throw new Error('Response object is null or undefined');
                    }
                    
                    if (typeof response.text !== 'function') {
                        console.error(`   ❌ response.text is not a function. Type: ${typeof response.text}`);
                        console.error(`   Response object:`, JSON.stringify(response, null, 2).substring(0, 500));
                        throw new Error('response.text is not a function');
                    }
                    
                    console.log(`   Calling response.text()...`);
                    generatedHtml = response.text().trim();
                    console.log(`   ✅ Got text from response`);
                    
                    console.log(`   Generated HTML length: ${generatedHtml.length} chars`);
                    if (generatedHtml.length > 0) {
                        console.log(`   First 200 chars: ${generatedHtml.substring(0, 200)}...`);
                    } else {
                        console.error(`   ❌ Generated HTML is empty!`);
                    }
                    
                    if (!generatedHtml || generatedHtml.length < 100) {
                        throw new Error(`Generated HTML is too short (${generatedHtml.length} chars, need at least 100)`);
                    }
                    
                    console.log(`✅ Variant ${i + 1} generated successfully (${generatedHtml.length} chars)`);
                    useFallback = false;
                } catch (error) {
                    errorDetails = {
                        message: error.message || 'Unknown error',
                        name: error.name || 'Error',
                        code: error.code || 'UNKNOWN',
                        type: 'generation_error',
                        stack: error.stack?.substring(0, 500) || null
                    };
                    
                    console.error(`❌ Error generating variant ${i + 1}:`, error.message);
                    console.error('   Error name:', error.name);
                    console.error('   Error code:', error.code);
                    console.error('   Error stack:', error.stack);
                    
                    // Check for specific error types
                    if (error.message?.includes('API_KEY') || error.message?.includes('API key') || error.message?.includes('expired')) {
                        errorDetails.type = 'api_key_error';
                        errorDetails.userMessage = 'API key is invalid or expired. Please check your GEMINI_API_KEY in .env file';
                        console.error('   ⚠️  API KEY ERROR - Check your GEMINI_API_KEY in .env file');
                    } else if (error.message?.includes('404') || error.message?.includes('not found')) {
                        errorDetails.type = 'model_not_found';
                        errorDetails.userMessage = 'Model gemini-2.5-flash not found. Your API key might not have access to this model.';
                        console.error('   ⚠️  MODEL NOT FOUND - gemini-2.5-flash might not be available');
                    } else if (error.message?.includes('quota') || error.message?.includes('Quota')) {
                        errorDetails.type = 'quota_error';
                        errorDetails.userMessage = 'API quota exceeded. Please check your usage limits.';
                        console.error('   ⚠️  QUOTA ERROR - You may have exceeded your API quota');
                    } else if (error.message?.includes('permission') || error.message?.includes('Permission')) {
                        errorDetails.type = 'permission_error';
                        errorDetails.userMessage = 'Permission denied. Check API key permissions.';
                        console.error('   ⚠️  PERMISSION ERROR - Check API key permissions');
                    } else {
                        errorDetails.userMessage = `Generation failed: ${error.message}`;
                    }
                    
                    generationErrors.push(errorDetails);
                    useFallback = true;
                }
            }

            // Debug: Log state before fallback check
            console.log(`\n📊 Pre-fallback check for variant ${i + 1}:`);
            console.log(`   useFallback: ${useFallback}`);
            console.log(`   generatedHtml exists: ${!!generatedHtml}`);
            console.log(`   generatedHtml length: ${generatedHtml?.length || 0}`);
            console.log(`   generatedHtml preview: ${generatedHtml?.substring(0, 50) || 'N/A'}...`);
            
            if (useFallback || !generatedHtml || generatedHtml.length < 100) {
                console.log(`\n⚠️  Using fallback HTML for variant ${i + 1}`);
                console.log(`   Reason: ${useFallback ? 'useFallback=true' : !generatedHtml ? 'generatedHtml is empty' : 'generatedHtml too short'}`);
                
                // Create a simple variant based on the original HTML with modifications
                const variantStyles = [
                    { bg: '#ffffff', text: '#333333', accent: '#f0f0f0', font: extractedProps.fontFamily || 'Arial, sans-serif' },
                    { bg: '#1a1a2e', text: '#eaeaea', accent: '#16213e', font: extractedProps.fontFamily || 'Georgia, serif' },
                ];

                const style = variantStyles[styleIndex] || variantStyles[0];
                const pageTitle = extractedProps.title || `${variantNames[styleIndex]} - ${subdomain}`;
                
                generatedHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: ${style.font};
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
        p { line-height: 1.6; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${variantNames[styleIndex]} Design</h1>
        <p>This is a fallback variant generated due to API limitations.</p>
        <p>Original content would appear here after successful AI generation.</p>
    </div>
</body>
</html>`;
            }

            // Clean up the HTML - remove markdown code blocks if present
            let cleanHtml = generatedHtml.trim();
            if (cleanHtml.startsWith('```html')) {
                cleanHtml = cleanHtml.substring(7);
            } else if (cleanHtml.startsWith('```')) {
                cleanHtml = cleanHtml.substring(3);
            }
            if (cleanHtml.endsWith('```')) {
                cleanHtml = cleanHtml.substring(0, cleanHtml.length - 3);
            }
            cleanHtml = cleanHtml.trim();

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
                        name: useFallback ? `${variantNames[styleIndex]} (Fallback)` : variantNames[styleIndex],
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

        console.log(`[${requestId}] ✅ Generated ${variants.length} variants for subdomain: ${subdomain}`);
        
        // Always include debug info in response
        const hasFallback = variants.some(v => v.name?.includes('Fallback'));
        const response = {
            success: true,
            variants,
            subdomain,
            debug: {
                requestId,
                apiKeyConfigured: !!GEMINI_API_KEY,
                apiKeyLength: GEMINI_API_KEY?.length || 0,
                apiKeyPrefix: GEMINI_API_KEY?.substring(0, 10) || 'none',
                modelInitialized: !!model,
                modelError: modelError?.message || null,
                generationErrors: generationErrors,
                hasFallback: hasFallback,
                variantCount: variants.length,
                timestamp: new Date().toISOString()
            }
        };
        
        if (hasFallback) {
            response.warning = 'Some variants were generated using fallback HTML. See debug object for details.';
            if (generationErrors.length > 0) {
                response.error = generationErrors[0].userMessage || generationErrors[0].message;
                response.errorDetails = generationErrors[0];
            } else if (!model) {
                response.error = 'Gemini model not initialized. Check API key.';
            } else {
                response.error = 'Unknown error - check debug object';
            }
        } else {
            response.message = 'Variants generated successfully using AI';
        }

        console.log(`[${requestId}] 📤 Sending response:`, {
            success: response.success,
            variantCount: response.variants.length,
            hasFallback: hasFallback,
            error: response.error || null
        });
        console.log(`${'='.repeat(60)}\n`);

        res.json(response);
    } catch (error) {
        console.error(`[${requestId}] ❌ Fatal error in generateVariants:`, error);
        console.error(`[${requestId}] Error stack:`, error.stack);
        res.status(500).json({
            success: false,
            error: 'Failed to generate variants',
            message: error.message,
            debug: {
                requestId,
                errorType: error.name,
                errorCode: error.code,
                timestamp: new Date().toISOString()
            }
        });
        console.log(`${'='.repeat(60)}\n`);
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