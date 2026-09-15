const fs = require('fs');
let file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update syncInspectionToSupabase to return success and log exact errors
const oldSync = `const syncInspectionToSupabase = async (insp) => {
    try {
      const safeInsp = {
        id: String(insp.id),
        location_id: Number(insp.location_id) || null,
        location_name: insp.location_name,
        inspector_id: Number(insp.inspector_id) || null,
        inspector_name: insp.inspector_name,
        supervisor_id: Number(insp.supervisor_id) || null,
        supervisor_name: insp.supervisor_name,
        status: insp.status,
        accepted: insp.accepted,
        score_pct: insp.score_pct,
        date: insp.date,
        items: insp.items,
        sections: insp.sections,
        notes: insp.notes,
        alert_level: insp.alert_level,
        type: insp.type,
        priority: insp.priority,
        template_id: insp.template_id,
        template_version: insp.template_version
      };
      const { error } = await supabase.from('fims_inspections').upsert(safeInsp);
      if (error) console.error("Supabase inspection sync error:", error.message);
    } catch (err) {
      console.error("Supabase sync error:", err);
    }
  };`;

const newSync = `const syncInspectionToSupabase = async (insp) => {
    try {
      const safeInsp = {
        id: String(insp.id),
        location_id: Number(insp.location_id) || null,
        location_name: insp.location_name,
        inspector_id: Number(insp.inspector_id) || null,
        inspector_name: insp.inspector_name,
        supervisor_id: Number(insp.supervisor_id) || null,
        supervisor_name: insp.supervisor_name,
        status: insp.status,
        accepted: insp.accepted,
        score_pct: insp.score_pct,
        date: insp.date,
        items: insp.items,
        sections: insp.sections,
        notes: insp.notes,
        alert_level: insp.alert_level,
        type: insp.type,
        priority: insp.priority,
        template_id: insp.template_id,
        template_version: insp.template_version
      };
      const { data, error } = await supabase.from('fims_inspections').upsert(safeInsp).select();
      if (error) {
        console.error("🔴 SUPABASE SAVE ERROR:", error.message, "Payload:", safeInsp);
        return false;
      }
      console.log("✅ SUPABASE SAVE SUCCESS:", data);
      return true;
    } catch (err) {
      console.error("Supabase sync error:", err);
      return false;
    }
  };`;

if (content.includes(oldSync)) {
  content = content.replace(oldSync, newSync);
} else {
  console.log('Could not find old sync function. Checking for alternative...');
  // Fallback regex just in case
  content = content.replace(/const syncInspectionToSupabase = async \(insp\) => \{[\s\S]*?\};/, newSync);
}

// 2. Update handleCreateSchedule to be async and await the save
const oldCreate = `const handleCreateSchedule = (tasks) => {`;
const newCreate = `const handleCreateSchedule = async (tasks) => {`;
content = content.replace(oldCreate, newCreate);

const oldLoop = `tasksWithTemplates.forEach(t => {
      syncInspectionToSupabase(t);
      if(t.inspector_id) notify(t.inspector_id, \`Nova tarefa agendada para \${t.date} no local \${t.location_name}.\`, "schedule");
    });`;
const newLoop = `for (const t of tasksWithTemplates) {
      const success = await syncInspectionToSupabase(t);
      if(!success) alert("Erro ao salvar inspeção no Supabase. Verifique o console (F12).");
      if(t.inspector_id) notify(t.inspector_id, \`Nova tarefa agendada para \${t.date} no local \${t.location_name}.\`, "schedule");
    }`;
content = content.replace(oldLoop, newLoop);

fs.writeFileSync(file, content, 'utf8');
console.log('✅ Save function updated with error logging!');
