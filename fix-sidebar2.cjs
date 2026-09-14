const fs = require('fs');
const file = 'src/components/Sidebar.jsx';
let content = fs.readFileSync(file, 'utf8');

// Find the audit menu item and add ROLES.CEO to the roles array
const oldAudit = '{ id: "audit", icon: "audit", label: t.audit, roles: [ROLES.ADMIN] }';
const newAudit = '{ id: "audit", icon: "audit", label: t.audit, roles: [ROLES.ADMIN, ROLES.CEO] }';

if (content.includes(oldAudit)) {
  content = content.replace(oldAudit, newAudit);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed! CEO now has access to the Audit page.');
} else {
  console.log('Could not find the audit menu item.');
}
