import pdfParse from 'pdf-parse'

export const extractTextFromPdf = async (fileBuffer: Buffer): Promise<string> => {
  try {
    const data = await pdfParse(fileBuffer)
    
    if (!data.text || data.text.trim() === '') {
      throw new Error('No text could be extracted from this PDF')
    }

    return data.text.trim()
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('Failed to parse PDF file')
  }
}