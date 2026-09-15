const fs = require('fs');

// Fix InspectionForm.jsx
let file1 = 'src/pages/InspectionForm.jsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace(
  ".eq('client_name', safeInspection.location_name).single();",
  ".ilike('client_name', safeInspection.location_name).single();"
);
fs.writeFileSync(file1, content1, 'utf8');
console.log('✅ InspectionForm.jsx updated!');

// Fix InspectionDetail.jsx
let file2 = 'src/pages/InspectionDetail.jsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(
  ".eq('client_name', inspection.location_name).single();",
  ".ilike('client_name', inspection.location_name).single();"
);
fs.writeFileSync(file2, content2, 'utf8');
console.log('✅ InspectionDetail.jsx updated!');
