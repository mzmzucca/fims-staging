const fs = require('fs');
let file = 'src/pages/InspectionForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add dataStore import if missing
if (!content.includes('import { dataStore } from "../lib/dataStore";')) {
  content = content.replace('import { supabase } from "../lib/supabase";', 'import { supabase } from "../lib/supabase";\nimport { dataStore } from "../lib/dataStore";');
}

// 2. Replace the localStorage draft saving with IndexedDB
const oldSave = `useEffect(() => {
    const draftData = { items, sections, notes, clientMgrName, inspectorSig, clientSig };
    localStorage.setItem(draftKey, JSON.stringify(draftData));
  }, [items, sections, notes, clientMgrName, inspectorSig, clientSig, draftKey]);`;
  
const newSave = `useEffect(() => {
    const draftData = { items, sections, notes, clientMgrName, inspectorSig, clientSig };
    dataStore.set('drafts', draftKey, draftData); // Save to IndexedDB instead
  }, [items, sections, notes, clientMgrName, inspectorSig, clientSig, draftKey]);`;

if (content.includes(oldSave)) {
  content = content.replace(oldSave, newSave);
}

// 3. Replace the localStorage draft loading with IndexedDB
const oldLoad = `const loadDraft = (field, fallback) => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (field === "items" && Array.isArray(parsed[field]) && parsed[field].length === 0 && Array.isArray(fallback) && fallback.length > 0) return fallback;
        return parsed[field] !== undefined ? parsed[field] : fallback;
      }
    } catch (e) {}
    return fallback;
  };`;
  
const newLoad = `const loadDraft = (field, fallback) => {
    try {
      return fallback;
    } catch (e) {}
    return fallback;
  };`;

if (content.includes(oldLoad)) {
  content = content.replace(oldLoad, newLoad);
}

// 4. Add a useEffect to fetch the draft from IndexedDB on mount
const oldInit = `const [items, setItems] = useState(() => loadDraft("items", safeInspection.items || []));`;
const newInit = `const [items, setItems] = useState(() => loadDraft("items", safeInspection.items || []));

  // Fetch draft from IndexedDB on mount
  useEffect(() => {
    async function fetchDraft() {
      const savedDraft = await dataStore.get('drafts', draftKey);
      if (savedDraft) {
        if (savedDraft.items) setItems(savedDraft.items);
        if (savedDraft.sections) setSections(savedDraft.sections);
        if (savedDraft.notes) setNotes(savedDraft.notes);
        if (savedDraft.clientMgrName) setClientMgrName(savedDraft.clientMgrName);
        if (savedDraft.inspectorSig) setInspectorSig(savedDraft.inspectorSig);
        if (savedDraft.clientSig) setClientSig(savedDraft.clientSig);
      }
    }
    fetchDraft();
  }, [draftKey]);`;

if (content.includes(oldInit)) {
  content = content.replace(oldInit, newInit);
}

// 5. Update the clear draft logic
content = content.replace("localStorage.removeItem(draftKey);", "dataStore.remove('drafts', draftKey);");

fs.writeFileSync(file, content, 'utf8');
console.log('InspectionForm drafts moved to IndexedDB successfully!');
