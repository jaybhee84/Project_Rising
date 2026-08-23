import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_WEBSITE_SUPABASE_URL || 'https://joilvslvsioayrjshuxg.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_WEBSITE_SUPABASE_ANON_KEY || 'sb_publishable_aozkBamT5C58KY03X9kUgA_iehy73ZU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
