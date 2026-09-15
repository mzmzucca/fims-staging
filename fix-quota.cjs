const fs = require('fs');

// Fix App.jsx
let file1 = 'src/App.jsx';
let content1 = fs.readFileSync(file1, 'utf8');

// 1. Remove localStorage save for templates
content1 = content1.replace(/localStorage\.setItem\('fims_templates'[^;]*;/g, '');
content1 = content1.replace(/localStorage\.setItem\('fims_template_clients'[^;]*;/g, '');

// 2. Replace getTemplate with async fetchTemplate
content1 = content1.replace(
  `const getTemplate = (name) => {
  const templates = JSON.parse(localStorage.getItem('fims_templates') || '{}');
  return templates[name.toLowerCase()] || { sections: [], totalItems: 0 };
};`,
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
};`
);

// 3. Update handleCreateSchedule to use async fetchTemplate
content1 = content1.replace(
  `const handleCreateSchedule = async (tasks) => {
  const tasksWithTemplates = tasks.map(task => { 
    const t = getTemplate(task.location_name); 
    const tSections = t.sections || [];
    return { 
      ...task, 
      supervisor_id: currentUser.id,
      supervisor_name: currentUser.name,
      items: tSections.flatMap(s => {
        const sectionItems = s.items || s.itens || [];
        return sectionItems.map(i => ({...i, section_id:s.id, score:null, comment:"", photos:[]}));
      }), 
      sections: tSections.map(s => ({id:s.id, title: s.title || s.name, observation:"", photos:[]})) 
    }; 
  });
  
  setInspections(prev => [...tasksWithTemplates, ...prev]);`,
  `const handleCreateSchedule = async (tasks) => {
  const tasksWithTemplates = [];
  for (const task of tasks) {
    const t = await fetchTemplate(task.location_name);
    const tSections = t.sections || [];
    tasksWithTemplates.push({
      ...task,
      supervisor_id: currentUser.id,
      supervisor_name: currentUser.name,
      items: tSections.flatMap(s => (s.items || s.itens || []).map(i => ({...i, section_id: s.id, score: null, comment: "", photos: []}))),
      sections: tSections.map(s => ({id: s.id, title: s.title || s.name, observation: "", photos: []}))
    });
  }
  
  setInspections(prev => [...tasksWithTemplates, ...prev]);`
);

// 4. Update handleBulkSchedule
content1 = content1.replace(
  `const handleBulkSchedule = async (tasks) => {
  const tasksWithTemplates = tasks.map(task => { 
    const t = getTemplate(task.location_name); 
    const tSections = t.sections || [];
    return { 
      ...task, 
      supervisor_id: currentUser.id,
      supervisor_name: currentUser.name,
      items: tSections.flatMap(s => {
        const sectionItems = s.items || s.itens || [];
        return sectionItems.map(i => ({...i, section_id:s.id, score:null, comment:"", photos:[]}));
      }), 
      sections: tSections.map(s => ({id:s.id, title: s.title || s.name, observation:"", photos:[]})) 
    }; 
  });
  setInspections(prev => [...tasksWithTemplates, ...prev]);`,
  `const handleBulkSchedule = async (tasks) => {
  const tasksWithTemplates = [];
  for (const task of tasks) {
    const t = await fetchTemplate(task.location_name);
    const tSections = t.sections || [];
    tasksWithTemplates.push({
      ...task,
      supervisor_id: currentUser.id,
      supervisor_name: currentUser.name,
      items: tSections.flatMap(s => (s.items || s.itens || []).map(i => ({...i, section_id: s.id, score: null, comment: "", photos: []}))),
      sections: tSections.map(s => ({id: s.id, title: s.title || s.name, observation: "", photos: []}))
    });
  }
  setInspections(prev => [...tasksWithTemplates, ...prev]);`
);

// 5. Update NewInspectionModal
content1 = content1.replace(`const template = getClientTemplate(loc.name);`, `const template = await fetchTemplate(loc.name);`);
content1 = content1.replace(`const handleCreate = () => {`, `const handleCreate = async () => {`);

fs.writeFileSync(file1, content1, 'utf8');
console.log('✅ App.jsx updated to fetch templates directly!');

// Fix InspectionForm.jsx and InspectionDetail.jsx
let file2 = 'src/pages/InspectionForm.jsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(".ilike('client_name', safeInspection.location_name).single();", ".eq('client_name', safeInspection.location_name).single();");
fs.writeFileSync(file2, content2, 'utf8');
console.log('✅ InspectionForm.jsx updated!');

let file3 = 'src/pages/InspectionDetail.jsx';
let content3 = fs.readFileSync(file3, 'utf8');
content3 = content3.replace(".ilike('client_name', inspection.location_name).single();", ".eq('client_name', inspection.location_name).single();");
fs.writeFileSync(file3, content3, 'utf8');
console.log('✅ InspectionDetail.jsx updated!');
