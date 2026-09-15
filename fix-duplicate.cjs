const fs = require('fs');
let file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the old localStorage block that declares dbTemplates
const oldBlock = `const { data: dbTemplates } = await supabase.from('fims_templates').select('*');
        if (dbTemplates && dbTemplates.length > 0) {
          const templateMap = {};
          const clientList = [];
          dbTemplates.forEach(t => {
            let parsedSections = t.sections;
            if (typeof parsedSections === 'string') {
              try { parsedSections = JSON.parse(parsedSections); } catch (e) { parsedSections = []; }
            }
            if (!Array.isArray(parsedSections)) parsedSections = [];
            
            templateMap[t.client_name.toLowerCase()] = {
              sections: parsedSections,
              clientName: t.client_name,
              totalItems: t.total_items || 0
            };
            clientList.push(t.client_name);
          });
          localStorage.setItem('fims_templates', JSON.stringify(templateMap));
          localStorage.setItem('fims_template_clients', JSON.stringify(clientList));
        }`;
        
if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, '');
  console.log('✅ Removed old duplicate dbTemplates block!');
} else {
  console.log('❌ Could not find exact block. Please check App.jsx manually.');
}

fs.writeFileSync(file, content, 'utf8');
