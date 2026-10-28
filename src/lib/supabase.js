import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qduscddctbvdyqebxbtk.supabase.co';
const supabasePublishableKey = 'sb_publishable_nBgxiYacQmuIyS3m69d1qA_N7kvAe9L';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
