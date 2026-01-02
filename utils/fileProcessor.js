// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE PROCESSOR - VERCEL SERVERLESS COMPATIBLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// 🎯 PURPOSE: Extract text from PDFs, Word docs, Excel files for AI processing
//
// 📦 REQUIRED DEPENDENCY - pdf2json (for PDF extraction):
//    ✅ CORRECT:  "pdf2json": "^4.0.0"  (or latest version)
//    ❌ WRONG:    "pdf-parse", "pdfjs-dist", "pdf.js-extract"
//
// 💻 INSTALLATION:
//    npm install pdf2json mammoth xlsx
//
// 🚀 WHY pdf2json?
//    ✅ Pure JavaScript - No native dependencies (Canvas, DOMMatrix, workers)
//    ✅ Serverless-ready - Works on Vercel, AWS Lambda, Azure Functions
//    ✅ Zero configuration - No worker files, no bundler issues
//    ✅ Reliable text extraction - Handles most PDF formats correctly
//
// ⚠️ WHAT WE TRIED (and why they failed on Vercel):
//    ❌ pdf.js-extract → Worker file resolution issues in serverless
//    ❌ pdf-parse v2 → Requires DOMMatrix/Canvas (not available in Node.js)
//    ❌ pdf-parse v1.1.1 → ENOENT: tries to access ./test/data/05-versions-space.pdf
//    ❌ pdfjs-dist@2.16.105 → Module not found errors on Vercel
//
// 🔧 TESTED ON:
//    ✅ Vercel Serverless Functions
//    ✅ Local Node.js development
//    ✅ ES Modules (type: "module" in package.json)
//
// 📝 USAGE:
//    import { extractTextFromFile, processFiles } from './fileProcessor.js';
//    
//    // Single file
//    const text = await extractTextFromFile({
//      filename: 'document.pdf',
//      mimeType: 'application/pdf',
//      data: base64String,
//      size: 28139
//    });
//
//    // Multiple files
//    const combinedText = await processFiles([file1, file2, file3]);
//
// 🎯 USE THIS EXACT SETUP FOR ALL SVÖRUM STRAX CHATBOTS!
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import mammoth from 'mammoth';
import XLSX from 'xlsx';

/**
 * Parse PDF using pdf2json (serverless-compatible)
 * 
 * pdf2json is a pure JavaScript PDF parser that works reliably
 * in serverless environments without any worker files or Canvas dependencies.
 * 
 * @param {Buffer} buffer - PDF file as Buffer
 * @returns {Promise<Object>} { text: string, numpages: number }
 */
async function parsePdf(buffer) {
  // Dynamic import of pdf2json
  const PDFParser = (await import('pdf2json')).default;
  
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    // Set up error handler
    pdfParser.on('pdfParser_dataError', (error) => {
      reject(new Error(error.parserError));
    });
    
    // Set up success handler
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        // Extract text from all pages
        let text = '';
        let pageCount = 0;
        
        if (pdfData.Pages) {
          pageCount = pdfData.Pages.length;
          
          pdfData.Pages.forEach((page) => {
            if (page.Texts) {
              page.Texts.forEach((textItem) => {
                if (textItem.R) {
                  textItem.R.forEach((run) => {
                    if (run.T) {
                      // Decode URI-encoded text with error handling
                      // Some PDFs have malformed encoding that breaks decodeURIComponent
                      try {
                        text += decodeURIComponent(run.T) + ' ';
                      } catch (e) {
                        // If decoding fails, use raw text
                        text += run.T + ' ';
                      }
                    }
                  });
                }
              });
              text += '\n'; // New line after each page
            }
          });
        }
        
        resolve({ text: text.trim(), numpages: pageCount });
      } catch (error) {
        reject(error);
      }
    });
    
    // Parse the PDF buffer
    pdfParser.parseBuffer(buffer);
  });
}

/**
 * Extract text from various file formats.
 * Supports: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), plain text
 * 
 * @param {Object} file - { filename, mimeType, data (base64), size }
 * @returns {Promise<string>} Extracted text content
 */
export async function extractTextFromFile(file) {
  const { filename, mimeType, data } = file;
  
  console.log(`📄 Extracting text from: ${filename} (${mimeType})`);
  
  try {
    // Convert base64 to Buffer
    const buffer = Buffer.from(data, 'base64');
    
    // PDF extraction with pdf2json (pure JavaScript, serverless-compatible)
    if (mimeType === 'application/pdf') {
      console.log('📄 Parsing PDF with pdf2json v4.0.0...');
      const pdfData = await parsePdf(buffer);
      console.log(`✅ PDF extracted: ${pdfData.text.length} chars, ${pdfData.numpages} pages`);
      return pdfData.text.trim();
    }
    
    // Word document extraction (.doc, .docx)
    if (mimeType.includes('word') || mimeType.includes('document')) {
      console.log('📄 Parsing Word document...');
      const result = await mammoth.extractRawText({ buffer });
      console.log(`✅ Word extracted: ${result.value.length} chars`);
      return result.value;
    }
    
    // Excel extraction (.xls, .xlsx)
    if (mimeType.includes('excel') || mimeType.includes('sheet')) {
      console.log('📄 Parsing Excel spreadsheet...');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let allText = '';
      
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        allText += `\n=== ${sheetName} ===\n${csv}\n`;
      });
      
      console.log(`✅ Excel extracted: ${allText.length} chars, ${workbook.SheetNames.length} sheets`);
      return allText;
    }
    
    // Plain text
    if (mimeType === 'text/plain') {
      console.log('📄 Reading plain text file...');
      const text = buffer.toString('utf-8');
      console.log(`✅ Text file extracted: ${text.length} chars`);
      return text;
    }
    
    throw new Error(`Unsupported file type: ${mimeType}`);
    
  } catch (error) {
    console.error(`❌ Error extracting text from ${filename}:`, error.message);
    return `[Could not extract text from ${filename}: ${error.message}]`;
  }
}

/**
 * Process multiple files and extract all text
 * 
 * @param {Array} files - Array of file objects
 * @returns {Promise<string>} Combined extracted text with file boundaries
 */
export async function processFiles(files) {
  if (!files || files.length === 0) return '';
  
  console.log(`📚 Processing ${files.length} files...`);
  
  const extractedTexts = await Promise.all(
    files.map(file => extractTextFromFile(file))
  );
  
  // Combine with file boundaries for context
  const combinedText = files.map((file, idx) => {
    return `\n━━━ ${file.filename} (${(file.size / 1024).toFixed(1)}KB) ━━━\n${extractedTexts[idx]}\n`;
  }).join('\n');
  
  console.log(`✅ All files processed: ${combinedText.length} total chars`);
  
  return combinedText;
}

export default { extractTextFromFile, processFiles };
