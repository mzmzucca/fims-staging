const fs = require('fs');
let file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldSetInspections = `setInspections(prev => [...tasksWithTemplates, ...prev]);`;
const newSetInspections = `
    // Override supervisor ID with the currently logged-in user
    tasksWithTemplates.forEach(t => {
      t.supervisor_id = currentUser.id;
      t.supervisor_name = currentUser.name;
    });
    setInspections(prev => [...tasksWithTemplates, ...prev]);`;
    
if (content.includes(oldSetInspections)) {
  content = content.replace(oldSetInspections, newSetInspections);
  fs.writeFileSync(file, content, 'utf8');
  console.log('✅ Supervisor ID override added!');
} else {
  console.log('❌ Could not find setInspections line. Manual check needed.');
}
