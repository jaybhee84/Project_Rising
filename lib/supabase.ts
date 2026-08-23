import { createClient } from '@supabase/supabase-js'

// Public website data (activities, MOOE, and org chart) lives in a different
// Supabase project from the BMI application. Use dedicated variable names so
// deployment settings for BMI cannot silently redirect these pages.
const supabaseUrl = process.env.NEXT_PUBLIC_WEBSITE_SUPABASE_URL || 'https://joilvslvsioayrjshuxg.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_WEBSITE_SUPABASE_ANON_KEY || 'sb_publishable_aozkBamT5C58KY03X9kUgA_iehy73ZU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Table export for MOOE Liquidation Report
export const MOOE_TABLE = 'MOOE liquidation report'
