const fs = require('fs');
let file = 'src/pages/InspectionForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the fetchMissingTemplate useEffect entirely
content = content.replace(/\/\/ Fetch real template from Supabase if inspection is missing items[\s\S]*?\}, \[safeInspection\.id\]\);/, '// Items are now populated correctly on creation');

fs.writeFileSync(file, content, 'utf8');
console.log('✅ InspectionForm.jsx updated!');
