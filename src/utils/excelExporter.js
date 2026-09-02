import ExcelJS from 'exceljs';

export const exportToExcelTable = async ({ filename, sheetName, columns, data }) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // 1. Add Data Rows
  worksheet.addRows(data.map(item => columns.map(col => item[col.key] ?? '')));

  // 2. Format as Native Excel Table
  worksheet.addTable({
    name: sheetName.replace(/\s+/g, '_'),
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium9', // Built-in Excel green table theme
      showRowStripes: true,
    },
    columns: columns.map(col => ({ name: col.header, filterButton: true })),
    rows: data.map(item => columns.map(col => item[col.key] ?? '')),
  });

  // 3. Auto-fit Column Widths for clean display
  worksheet.columns.forEach((column, index) => {
    const colHeader = columns[index]?.header || '';
    let maxLen = colHeader.length;
    
    data.forEach(row => {
      const val = String(row[columns[index]?.key] ?? '');
      if (val.length > maxLen) maxLen = val.length;
    });

    column.width = Math.max(maxLen + 4, 12);
  });

  // 4. Generate & Download .xlsx File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};