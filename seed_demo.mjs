import { createClient } from './node_modules/@supabase/supabase-js/dist/module/index.js';
import { readFileSync } from 'fs';

const supabase = createClient('https://gwtgfaxyvbudgcjesfbd.supabase.co', 'sb_publishable_Atf2T1NuJE-geLiZ8FpgNQ_FOZxQcr3');

const analysis = JSON.parse(readFileSync('./demo_analysis_tmp.json', 'utf8'));

const meeting = {
  id: 'demo-protocol-2024-11',
  title: 'פרוטוקול ועדת בטיחות — כימוטק נובמבר 2024',
  meeting_date: '2024-11-12',
  created_at: '2024-11-12T09:00:00Z',
  analysis
};

const { error } = await supabase.from('meetings').upsert(meeting);
if (error) {
  console.error('Error:', error.message);
  process.exit(1);
} else {
  console.log('SUCCESS: Demo meeting inserted!');
  console.log('Tasks:', meeting.analysis.tasks.length, '| Red flags:', meeting.analysis.red_flags.length);
}
