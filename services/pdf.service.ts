import pdfParse from 'pdf-parse'
import { createCanvas } from '@napi-rs/canvas'
import { extractTextFromImage } from './ai.service'
import path from 'path'
import { pathToFileURL } from 'url'

/**
 * Robust PDF text extraction with OCR fallback for scanned documents.
 */
export const extractTextFromPdf = async (fileBuffer: Buffer): Promise<string> => {
  try {
    // 1. Attempt standard parsing
    const data = await pdfParse(fileBuffer)
    
    if (data.text && data.text.trim().length > 0) {
      return data.text.trim()
    }

    // 2. OCR Fallback if text is empty (scanned PDF)
    console.warn('PDF has no selectable text. Triggering OCR Fallback...')
    return await extractTextViaOCR(fileBuffer)

  } catch (error) {
    console.error('PDF parsing error:', error)
    // Attempt OCR even if standard parsing crashed (sometimes happens with complex structures)
    try {
      console.warn('Std parsing failed. Attempting OCR Fallback as a last resort...')
      return await extractTextViaOCR(fileBuffer)
    } catch (ocrError) {
      console.error('OCR Fallback also failed:', ocrError)
      throw new Error('Failed to parse PDF file (standard and OCR both failed)')
    }
  }
}

/**
 * Renders the first 3 pages of the PDF to images and extracts text using AI.
 */
async function extractTextViaOCR(fileBuffer: Buffer): Promise<string> {
  // Dynamic import to avoid build-time issues with pdfjs-dist in Next.js environment
  // @ts-ignore (legacy build doesn't have local type definitions in this context)
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // Explicitly set the worker source to the absolute path of the worker file.
  // We use pathToFileURL to ensure it is a valid 'file://' URL on Windows for ESM.
  const workerPath = path.resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).toString();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(fileBuffer),
    useSystemFonts: true,
    disableFontFace: true, // Prevents loading fonts for faster rendering
  })

  const pdf = await loadingTask.promise
  const numPages = Math.min(pdf.numPages, 3) // Extract first 3 pages for sanity
  let allExtractedText = ''

  console.log(`Processing ${numPages} pages via OCR...`)

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2.0 }) // High scale for better OCR
    
    const canvas = createCanvas(viewport.width, viewport.height)
    const context = canvas.getContext('2d')

    // @ts-ignore - Rendering to node-canvas requires a factory, but often works directly in newer pdfjs with canvas context
    await page.render({
      canvasContext: context as any,
      viewport: viewport,
    }).promise

    const imageBuffer = canvas.toBuffer('image/png')
    
    // Extract text from the rendered page image using AI
    const pageText = await extractTextFromImage(imageBuffer, 'image/png')
    allExtractedText += `\n--- Page ${i} ---\n${pageText}\n`
  }

  if (!allExtractedText.trim()) {
    throw new Error('OCR was unable to read any text from the PDF pages')
  }

  return allExtractedText.trim()
}