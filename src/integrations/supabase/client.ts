// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lzdgzvmiivceyqfmpjjb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZGd6dm1paXZjZXlxZm1wampiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4OTc1NzQsImV4cCI6MjA2ODQ3MzU3NH0.K1ONxmiS5oCh6o6Y9tVhwPt8NQWMDxJSxyVdTZ73gHU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});