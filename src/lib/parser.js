import { PRIORITY_CODES } from './constants';

/**
 * Parser for the accounting HTML trial balance export.
 */
export async function parseAccountingHTML(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        // Decode using windows-1256 for Arabic support in many legacy systems
        const decoder = new TextDecoder('windows-1256');
        const htmlText = decoder.decode(arrayBuffer);

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const rows = Array.from(doc.querySelectorAll('tr'));
        
        const data = [];
        
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          
          // Data rows in this specific report have a name cell with COLSPAN=5
          // or a large number of cells.
          if (cells.length >= 8) {
            const nameCell = cells.find(c => c.getAttribute('colspan') === '5');
            if (!nameCell) return;

            const name = nameCell.textContent.trim();
            const code = cells[cells.length - 1].textContent.trim();
            
            // Skip headers/totals
            if (!name || name.includes('إجمالي') || name.includes('صفحة') || name.includes('الحساب')) {
              return;
            }

            // Filter for priority codes only to reduce DB operations
            if (!PRIORITY_CODES.includes(code)) {
              return;
            }
            
            // Numerical values are usually in ALIGN=right cells BEFORE the name cell
            const values = cells
              .filter(cell => cell.getAttribute('align') === 'right' && cell !== nameCell && cell !== cells[cells.length-1])
              .map(cell => {
                const text = cell.textContent.trim().replace(/,/g, '');
                return parseFloat(text) || 0;
              });
            
            if (values.length >= 5) {
              data.push({
                account: name,
                accountCode: code,
                // Mapping based on user feedback:
                // values[0,1] -> Closing Balance (Final)
                // values[2,3] -> Totals (Movement)
                // values[4,5] -> Opening Balance
                openingBalance: {
                  debit: values[4] || 0,
                  credit: values[5] || 0
                },
                totals: {
                  debit: values[2],
                  credit: values[3]
                },
                closingBalance: {
                  debit: values[0],
                  credit: values[1] || 0
                }
              });
            }
          }
        });

        resolve(data);
      } catch (err) {
        console.error('Parsing error:', err);
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
