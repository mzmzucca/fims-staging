const fs = require('fs');
const file = 'src/components/Sidebar.jsx';
let content = fs.readFileSync(file, 'utf8');

// Look for any ADMIN-only checks and add CEO
// Case 1: role === ROLES.ADMIN
if (content.includes('role === ROLES.ADMIN') && !content.includes('role === ROLES.ADMIN || role === ROLES.CEO')) {
  content = content.replace(/role === ROLES\.ADMIN/g, '(role === ROLES.ADMIN || role === ROLES.CEO)');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed! CEO now has access to all Admin pages (including Audit).');
} 
// Case 2: role === "admin"
else if (content.includes('role === "admin"') && !content.includes('role === "admin" || role === "ceo"')) {
  content = content.replace(/role === "admin"/g, '(role === "admin" || role === "ceo")');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed! CEO now has access to all Admin pages (including Audit).');
} 
else {
  console.log('No changes needed or pattern not found. Check Sidebar.jsx manually.');
}
