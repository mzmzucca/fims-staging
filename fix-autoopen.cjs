const fs = require('fs');
let file = 'src/pages/InspectionForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// Use regex to remove the auto-open useEffect
content = content.replace(/useEffect\(\(\) => \{\s*if \(templateSections\.length > 0 && expandedSections\.length === 0\) \{\s*setExpandedSections\(\[templateSections\[0\]\.id\]\);\s*\}\s*\}, \[templateSections\]\);/g, '// All sections start collapsed by default');

fs.writeFileSync(file, content, 'utf8');
console.log('✅ Auto-open removed via regex!');
