const fs = require('fs');
let file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add a robust filter function before handleNavigate
const filterFn = `
// Privacy Filter: Ensure users only see inspections they are authorized to see
const getFilteredInspections = () => {
  if (!currentUser) return [];
  if (currentUser.role === 'admin' || currentUser.role === 'ceo') return inspections;
  
  return inspections.filter(i => {
    if (i.type === 'leave' && currentUser.role !== 'inspector') return false;
    
    // Inspectors ONLY see their own inspections
    if (currentUser.role === 'inspector') {
      return String(i.inspector_id) === String(currentUser.id) || 
             (i.inspector_name && i.inspector_name.toLowerCase() === currentUser.name.toLowerCase());
    }
    
    // Supervisors see inspections they supervise OR unassigned ones
    if (currentUser.role === 'supervisor') {
      return String(i.supervisor_id) === String(currentUser.id) || 
             (i.supervisor_name && i.supervisor_name.toLowerCase() === currentUser.name.toLowerCase()) ||
             !i.supervisor_id;
    }
    
    return false;
  });
};
`;
if (!content.includes('const getFilteredInspections = () => {')) {
  content = content.replace('  const handleNavigate = (p) => {', filterFn + '\n  const handleNavigate = (p) => {');
}

// 2. Replace hardcoded supervisor ID and Name with dynamic currentUser
content = content.split('supervisor_id: 3,').join('supervisor_id: currentUser.id,');
content = content.split('supervisor_name: "Ana Sitoe",').join('supervisor_name: currentUser.name,');

// 3. Replace inspections={inspections} with inspections={getFilteredInspections()} in the UI render
const renderStart = content.indexOf('return (');
if (renderStart !== -1) {
  const before = content.slice(0, renderStart);
  let after = content.slice(renderStart);
  // Replace in the main render, but NOT inside the PDF generator or sync functions
  after = after.split('inspections={inspections}').join('inspections={getFilteredInspections()}');
  content = before + after;
}

fs.writeFileSync(file, content, 'utf8');
console.log('✅ Privacy filter and dynamic supervisor added!');
