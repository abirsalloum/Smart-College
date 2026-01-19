
import * as XLSX from 'xlsx';

export const extractTextFromExcel = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        let fullText = '';
        
        workbook.SheetNames.forEach(sheetName => {
          fullText += `--- SHEET: ${sheetName} ---\n`;
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          json.forEach((row: any) => {
            if (Array.isArray(row)) {
              fullText += row.join('\t') + '\n';
            }
          });
          fullText += '\n';
        });
        
        resolve(fullText.trim());
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
