const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://cfplibrosawkrdgkmebw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcGxpYnJvc2F3a3JkZ2ttZWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzE2MzcsImV4cCI6MjEwMzg0NzYzN30.KHfmVum-f2wqIiPouu0WYrCVU1HVTlZH4UFp1J4tjrw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  // Automatically find any Excel file in the current folder
  const files = fs.readdirSync('./');
  const excelFile = files.find(f => f.endsWith('.xls') || f.endsWith('.xlsx'));
  
  if (!excelFile) {
    console.error('❌ Error: No Excel file (.xls or .xlsx) found in the root folder.');
    return;
  }

  console.log(`📖 Found Excel file: ${excelFile}`);
  const workbook = xlsx.readFile(excelFile);
  const templates = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

    let currentSections = [];
    let currentSection = null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const text = String(row[0] || '').trim();
      if (!text || text === 'undefined' || text === 'HEAD') continue;

      // Skip metadata rows
      if (text.startsWith('Relatório') || text.startsWith('Sistemas') || text.startsWith('5. Excelente') || text.startsWith('4. Acima') || text.startsWith('3. média') || text.includes('Pontuação') || text.startsWith('DATA') || text.startsWith('Assinatura') || text.startsWith('Observações')) {
        continue;
      }

      // Check if it's a section header (ALL CAPS and no scores in the row)
      const isAllCaps = text === text.toUpperCase() && /[A-Z]/.test(text);
      const hasNoScores = row.slice(1).every(v => v === undefined || v === null || v === '' || v === '*');

      if (isAllCaps && hasNoScores) {
        currentSection = {
          id: `sec_${sheetName}_${currentSections.length}_${Date.now()}`,
          title: text,
          items: []
        };
        currentSections.push(currentSection);
      } else if (currentSection) {
        currentSection.items.push({
          id: `item_${sheetName}_${currentSections.length}_${currentSection.items.length}_${Date.now()}`,
          text: text,
          score: null,
          comment: "",
          photos: []
        });
      }
    }

    if (currentSections.length > 0) {
      const totalItems = currentSections.reduce((acc, s) => acc + s.items.length, 0);
      templates.push({
        client_name: sheetName,
        sections: currentSections,
        total_items: totalItems,
        last_updated: new Date().toISOString()
      });
    }
  }

  console.log(`✅ Parsed ${templates.length} templates from Excel.`);

  console.log('⏳ Uploading templates to Supabase...');
  const { data, error } = await supabase
    .from('fims_templates')
    .upsert(templates, { onConflict: 'client_name' });

  if (error) {
    console.error('❌ Error uploading to Supabase:', error.message);
  } else {
    console.log('🎉 Successfully uploaded ALL templates to Supabase!');
    console.log('You can now refresh the app and see all inspections with their correct items.');
  }
}

run();
