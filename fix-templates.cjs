const fs = require('fs');
let file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Lowercase all template keys when saving to localStorage
content = content.replace(
  "templateMap[t.client_name] = {",
  "templateMap[t.client_name.toLowerCase()] = {"
);

// 2. Add a helper function to get templates case-insensitively
const helper = `
// Case-insensitive template getter
const getTemplate = (name) => {
  const templates = JSON.parse(localStorage.getItem('fims_templates') || '{}');
  return templates[name.toLowerCase()] || { sections: [], totalItems: 0 };
};
`;
if (!content.includes('const getTemplate = (name)')) {
  content = content.replace('const syncInspectionToSupabase', helper + '\nconst syncInspectionToSupabase');
}

// 3. Replace all getClientTemplate calls with getTemplate
content = content.split('getClientTemplate(').join('getTemplate(');

fs.writeFileSync(file, content, 'utf8');
console.log('✅ App.jsx updated for case-insensitive template matching!');
