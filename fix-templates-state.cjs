const fs = require('fs');
let file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add templates state
content = content.replace(
  'const [locations, setLocations] = useState([]);',
  'const [locations, setLocations] = useState([]);\n  const [templates, setTemplates] = useState({});'
);

// 2. Fetch templates into state in loadData
content = content.replace(
  `const { data: dbLocations } = await supabase.from('fims_locations').select('*').order('name', { ascending: true });\n        if (dbLocations && dbLocations.length > 0) setLocations(dbLocations);`,
  `const { data: dbLocations } = await supabase.from('fims_locations').select('*').order('name', { ascending: true });\n        if (dbLocations && dbLocations.length > 0) setLocations(dbLocations);\n\n        const { data: dbTemplates } = await supabase.from('fims_templates').select('*');\n        if (dbTemplates && dbTemplates.length > 0) {\n          const templateMap = {};\n          dbTemplates.forEach(t => {\n            let parsedSections = t.sections;\n            if (typeof parsedSections === 'string') {\n              try { parsedSections = JSON.parse(parsedSections); } catch (e) { parsedSections = []; }\n            }\n            if (!Array.isArray(parsedSections)) parsedSections = [];\n            templateMap[t.client_name.toLowerCase().trim()] = { sections: parsedSections, clientName: t.client_name, totalItems: t.total_items || 0 };\n          });\n          setTemplates(templateMap);\n        }`
);

// 3. Replace async fetchTemplate with synchronous getTemplate
content = content.replace(
  `const fetchTemplate = async (name) => {
  try {
    const { data } = await supabase.from('fims_templates').select('sections').eq('client_name', name).single();
    if (data && data.sections) {
      return { sections: data.sections, totalItems: data.sections.reduce((acc, s) => acc + (s.items?.length || 0), 0) };
    }
    return { sections: [], totalItems: 0 };
  } catch (err) {
    return { sections: [], totalItems: 0 };
  }
};`,
  `const getTemplate = (name) => {
  return templates[name.toLowerCase().trim()] || { sections: [], totalItems: 0 };
};`
);

// 4. Update handleCreateSchedule
content = content.replace(
  `for (const task of tasks) {
    const t = await fetchTemplate(task.location_name);`,
  `for (const task of tasks) {
    const t = getTemplate(task.location_name);`
);

// 5. Update handleBulkSchedule
content = content.replace(
  `for (const task of tasks) {
    const t = await fetchTemplate(task.location_name);`,
  `for (const task of tasks) {
    const t = getTemplate(task.location_name);`
);

// 6. Update NewInspectionModal
content = content.replace(`const template = await fetchTemplate(loc.name);`, `const template = getTemplate(loc.name);`);

fs.writeFileSync(file, content, 'utf8');
console.log('✅ App.jsx updated to use React state for templates!');
