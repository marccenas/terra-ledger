import * as XLSX from 'xlsx';

/**
 * Exports multiple pre-organized data tables into a single formatted Excel sheet
 * @param {Array<{title: string, data: Array<Object>}>} sections - Array of table sections
 * @param {string} fileName - Output file name without extension
 * @param {string} sheetName - Excel sheet name
 */
export const exportPreOrganizedExcel = (sections, fileName = 'Report', sheetName = 'Summary') => {
  try {
    const workbook = XLSX.utils.book_new();
    const sheetData = [];

    sections.forEach(section => {
      // 1. Add Section Title
      sheetData.push([section.title.toUpperCase()]);
      
      if (!section.data || section.data.length === 0) {
        sheetData.push(['No data available']);
        sheetData.push([]); // Blank row spacer
        return;
      }

      // 2. Add Table Column Headers
      const headers = Object.keys(section.data[0]);
      sheetData.push(headers);

      // 3. Add Table Data Rows
      section.data.forEach(row => {
        sheetData.push(headers.map(header => row[header]));
      });

      // 4. Add Empty Spacing Rows Between Tables
      sheetData.push([]); 
      sheetData.push([]); 
    });

    // Generate Worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Dynamic Column Width Calculation
    const colWidths = sheetData.reduce((acc, row) => {
      row.forEach((val, colIndex) => {
        const len = val ? val.toString().length : 10;
        acc[colIndex] = Math.max(acc[colIndex] || 10, len + 3);
      });
      return acc;
    }, []);

    worksheet['!cols'] = colWidths.map(w => ({ wch: w }));

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Pre-organized Export Error:', error);
    throw error;
  }
};