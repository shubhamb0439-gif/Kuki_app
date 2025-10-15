import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      *,
      job_postings(title, profession, description),
      applicant:profiles!job_applications_applicant_id_fkey(name, email, profile_photo, profession)
    `)
    .limit(1);

  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}

testQuery();
