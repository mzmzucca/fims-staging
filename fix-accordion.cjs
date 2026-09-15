const fs = require('fs');
let file = 'src/pages/InspectionForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix toggleSection to be instant and independent
const oldToggle = `const toggleSection = (secId) => {
    setExpandedSections(prev => prev.includes(secId) ? prev.filter(id => id !== secId) : [...prev, secId]);
  };`;
const newToggle = `const toggleSection = (secId) => {
    setExpandedSections(prev => {
      if (prev.includes(secId)) {
        return prev.filter(id => id !== secId);
      } else {
        return [...prev, secId];
      }
    });
  };`;
if (content.includes(oldToggle)) {
  content = content.replace(oldToggle, newToggle);
  console.log('✅ Accordion toggle fixed!');
} else {
  console.log('❌ Could not find toggleSection function.');
}

// 2. Ensure sections start collapsed (remove auto-open of first section)
const oldAutoOpen = `// Expandir primeira seção por padrão
  useEffect(() => {
    if (templateSections.length > 0 && expandedSections.length === 0) {
      setExpandedSections([templateSections[0].id]);
    }
  }, [templateSections]);`;
const newAutoOpen = `// All sections start collapsed by default
  // User can open/close them independently`;
if (content.includes(oldAutoOpen)) {
  content = content.replace(oldAutoOpen, newAutoOpen);
  console.log('✅ Auto-open removed!');
} else {
  console.log('❌ Could not find auto-open useEffect.');
}

fs.writeFileSync(file, content, 'utf8');
