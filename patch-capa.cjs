const fs = require('fs');
const file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldNotify = `    // Calculate duration
    let durationMin = 0;
    if (updated.started_at) {
      durationMin = Math.round((new Date() - new Date(updated.started_at)) / 60000);
    }
    authService.logEvent('inspection.submit', currentUser, { 
      inspection_id: updated.id, 
      location: updated.location_name, 
      score: updated.score_pct,
      duration_min: durationMin
    });
    
    notify(updated.supervisor_id, \`Nova inspeção submetida por \${currentUser.name} para \${updated.location_name}.\`, "inspections");`;

const newNotify = `    // Calculate duration
    let durationMin = 0;
    if (updated.started_at) {
      durationMin = Math.round((new Date() - new Date(updated.started_at)) / 60000);
    }
    authService.logEvent('inspection.submit', currentUser, { 
      inspection_id: updated.id, 
      location: updated.location_name, 
      score: updated.score_pct,
      duration_min: durationMin
    });

    // Phase 5: Automated CAPA Generation
    const lowScoreItems = (updated.items || []).filter(i => i.score !== null && i.score <= 2);
    if (lowScoreItems.length > 0) {
      const dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + 48); // 48-hour deadline
      
      const capas = lowScoreItems.map(item => ({
        inspection_id: updated.id,
        location_name: updated.location_name,
        item_text: item.text,
        score: item.score,
        due_date: dueDate.toISOString(),
        assigned_to: updated.client_mgr_name || 'Client'
      }));

      await supabase.from('fims_capas').insert(capas);
      authService.logEvent('capa.auto_generated', currentUser, { 
        inspection_id: updated.id, 
        location: updated.location_name, 
        count: capas.length 
      });
    }
    
    notify(updated.supervisor_id, \`Nova inspeção submetida por \${currentUser.name} para \${updated.location_name}.\`, "inspections");`;

if (!content.includes(oldNotify)) {
  console.error('ERROR: target block not found in src/App.jsx. Aborting.');
  console.error('Check indentation / exact whitespace around the notify() call.');
  process.exit(1);
}

content = content.replace(oldNotify, newNotify);
fs.writeFileSync(file, content, 'utf8');
console.log('Phase 5: Automated CAPA generation added!');
