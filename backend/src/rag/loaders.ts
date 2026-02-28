import { traceable } from 'langsmith/traceable';
// @ts-ignore
import pdfParse from 'pdf-parse';

// Internal structure holding extracted raw text and page count from a document
export interface DocumentContent {
  text: string;
  pageCount: number;
}

/**
 * Given a binary file buffer and original fileName, extracts the text, and returns the contents.
 *
 * @param buffer - The binary buffer holding the PDF's contents
 * @param fileName - Original name the user uploaded the PDF with
 * @returns An object containing the extracted raw text string and the total number of pages parsed.
 */
// Wraps the entire PDF parsing sequence as a tracked "tool" in LangSmith
export const loadPdfFromBuffer = traceable(
  async (buffer: Buffer, fileName: string): Promise<DocumentContent> => {
    // pdf-parse extract payload bounds
    const data = await pdfParse(buffer, {
      max: 0, // 0 = no page limit
    });

    return {
      text: data.text,
      pageCount: data.numpages,
    };
  },
  {
    name: "Load PDF Sequence",
    run_type: "tool",
  }
);
