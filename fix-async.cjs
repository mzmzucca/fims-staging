const fs = require('fs');
const file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// Look for the exact line and replace it
const target = 'const handleSubmitInspection = (updated) => {';
const replacement = 'const handleSubmitInspection = async (updated) => {';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed! handleSubmitInspection is now async.');
} else if (content.includes(replacement)) {
  console.log('It is already async!');
} else {
  // Fallback regex just in case there are extra spaces
  const regex = /const handleSubmitInspection\s*=\s*\(updated\)\s*=>\s*\{/;
  if (regex.test(content)) {
    content = content.replace(regex, 'const handleSubmitInspection = async (updated) => {');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed via regex! handleSubmitInspection is now async.');
  } else {
    console.error('ERROR: Could not find handleSubmitInspection at all.');
  }
}
