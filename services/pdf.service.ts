import pdfParse from 'pdf-parse'
 
/**
 * PDF text extraction (Strict: No OCR fallback for scanned documents).
 */
export const extractTextFromPdf = async (fileBuffer: Buffer): Promise<string> => {
  try {
    // 1. Attempt standard parsing
    const data = await pdfParse(fileBuffer)
    
    if (data.text && data.text.trim().length > 0) {
      return data.text.trim()
    }

    throw new Error('Please use the image upload feature')
  } catch (error: any) {
    console.error('PDF parsing error:', error)
    if (error.message === 'Please use the image upload feature') {
      throw error;
    }
    throw new Error('Please use the image upload feature')
  }
}