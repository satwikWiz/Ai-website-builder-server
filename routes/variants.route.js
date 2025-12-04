import { PrismaClient } from '@prisma/client';
import { geminiService } from '../services/gemini.service.js';
import { extractPropertiesFromHtml, createFallbackHtml } from '../utils/html-extractor.js';
import { convertHtmlToEditorElements } from '../utils/elements-converter.js';

const prisma = new PrismaClient();

// Variant design configurations
const VARIANT_PROMPTS = [
  'Create a modern, minimalist version of this website with clean lines and lots of white space. Focus on simplicity and elegance.',
  'Create a professional, corporate version with a traditional layout, conservative colors, and structured content organization.',
];

const VARIANT_NAMES = [
  'Modern Minimalist',
  'Professional Corporate',
];

const VARIANT_STYLES = [
  { bg: '#ffffff', text: '#333333', accent: '#f0f0f0', font: 'Arial, sans-serif' },
  { bg: '#1a1a2e', text: '#eaeaea', accent: '#16213e', font: 'Georgia, serif' },
];

/**
 * Generate Variants Route
 * POST /api/variants/generate
 */
export async function generateVariants(req, res, next) {
  try {
    const { html, styles, subdomain } = req.body;

    // Validate input
    if (!html || !subdomain) {
      return res.status(400).json({
        success: false,
        error: 'HTML and subdomain are required',
      });
    }

    console.log(`[${req.requestId}] Generating variants for: ${subdomain}`);

    // Determine variant style based on subdomain
    const domainHash = subdomain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variantIndex = domainHash % VARIANT_PROMPTS.length;
    const styleIndex = variantIndex;

    // Extract properties from original HTML
    const extractedProps = extractPropertiesFromHtml(html, styles);

    // Generate variant
    let generatedHtml = '';
    let useFallback = false;
    let errorDetails = null;

    if (geminiService.isReady()) {
      try {
        console.log(`[${req.requestId}] Using Gemini AI to generate variant...`);
        
        generatedHtml = await geminiService.generateVariant(
          html,
          styles,
          VARIANT_PROMPTS[styleIndex]
        );

        if (!generatedHtml || generatedHtml.length < 100) {
          throw new Error(`Generated HTML is too short (${generatedHtml.length} chars)`);
        }

        console.log(`[${req.requestId}] ✅ Generated ${generatedHtml.length} chars of HTML`);
        useFallback = false;
      } catch (error) {
        console.error(`[${req.requestId}] ❌ Generation error:`, error.message);
        errorDetails = {
          message: error.message,
          type: getErrorType(error),
          userMessage: getUserFriendlyMessage(error),
        };
        useFallback = true;
      }
    } else {
      console.warn(`[${req.requestId}] ⚠️  Gemini service not ready, using fallback`);
      useFallback = true;
    }

    // Use fallback if generation failed
    if (useFallback || !generatedHtml || generatedHtml.length < 100) {
      console.log(`[${req.requestId}] Using fallback HTML`);
      const styleConfig = {
        ...VARIANT_STYLES[styleIndex],
        font: extractedProps.fontFamily || VARIANT_STYLES[styleIndex].font,
      };
      generatedHtml = createFallbackHtml(
        extractedProps,
        VARIANT_NAMES[styleIndex],
        subdomain,
        styleConfig
      );
    }

    // Save to database
    const elements = convertHtmlToEditorElements(generatedHtml);
    const variant = await prisma.variant.create({
      data: {
        subdomain,
        variantNumber: 1,
        html: generatedHtml,
        elements: JSON.stringify(elements),
        name: useFallback 
          ? `${VARIANT_NAMES[styleIndex]} (Fallback)` 
          : VARIANT_NAMES[styleIndex],
      },
    });

    // Build response
    const response = {
      success: true,
      variants: [{
        id: variant.id,
        variantNumber: variant.variantNumber,
        name: variant.name,
        html: variant.html,
        elements: JSON.parse(variant.elements),
      }],
      subdomain,
      debug: {
        requestId: req.requestId,
        geminiReady: geminiService.isReady(),
        useFallback,
        errorDetails,
        variantIndex: styleIndex,
        timestamp: new Date().toISOString(),
      },
    };

    if (useFallback) {
      response.warning = 'Variant generated using fallback HTML';
      if (errorDetails) {
        response.error = errorDetails.userMessage;
      }
    } else {
      response.message = 'Variant generated successfully using AI';
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get Variants Route
 * GET /api/variants/:subdomain
 */
export async function getVariants(req, res, next) {
  try {
    const { subdomain } = req.params;

    if (!subdomain || subdomain === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'Invalid subdomain',
      });
    }

    const variants = await prisma.variant.findMany({
      where: { subdomain },
      orderBy: { variantNumber: 'asc' },
    });

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
    next(error);
  }
}

/**
 * Get Single Variant Route
 * GET /api/variant/:variantId
 */
export async function getVariant(req, res, next) {
  try {
    const { variantId } = req.params;

    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found',
      });
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
    next(error);
  }
}

/**
 * Save Variant Route
 * PUT /api/variant/:variantId
 */
export async function saveVariant(req, res, next) {
  try {
    const { variantId } = req.params;
    const { elements } = req.body;

    if (!elements) {
      return res.status(400).json({
        success: false,
        error: 'Elements are required',
      });
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
    next(error);
  }
}

// Helper functions
function getErrorType(error) {
  if (error.message?.includes('API_KEY') || error.message?.includes('API key')) return 'api_key_error';
  if (error.message?.includes('404') || error.message?.includes('not found')) return 'model_not_found';
  if (error.message?.includes('quota')) return 'quota_error';
  if (error.message?.includes('permission')) return 'permission_error';
  return 'generation_error';
}

function getUserFriendlyMessage(error) {
  if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
    return 'Invalid or expired API key. Please check your GEMINI_API_KEY.';
  }
  if (error.message?.includes('404') || error.message?.includes('not found')) {
    return 'Model not found. Your API key might not have access to this model.';
  }
  if (error.message?.includes('quota')) {
    return 'API quota exceeded. Please check your usage limits.';
  }
  if (error.message?.includes('permission')) {
    return 'Permission denied. Check API key permissions.';
  }
  return error.message || 'Generation failed';
}

