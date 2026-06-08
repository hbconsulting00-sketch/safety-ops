const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient('https://gwtgfaxyvbudgcjesfbd.supabase.co', 'sb_publishable_Atf2T1NuJE-geLiZ8FpgNQ_FOZxQcr3');

const analysis = JSON.parse(fs.readFileSync('./demo_analysis_tmp.json', 'utf8'));

const meeting = {
  id: 'demo-protocol-2024-11',
  title: 'פרוטוקול ועדת בטיחות — כימוטק נובמבר 2024',
  meeting_date: '2024-11-12',
  created_at: '2024-11-12T09:00:00Z',
  analysis
};

supabase.from('meetings').upsert(meeting).then(({ error }) => {
  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } else {
    console.log('SUCCESS! Tasks:', meeting.analysis.tasks.length, '| Red flags:', meeting.analysis.red_flags.length);
  }
});
