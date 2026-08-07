import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://usbqwedfhmceasrepjnb.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_SsMtcj2eu7PZnSRg3geAXQ_X425usO5'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Table export for MOOE Liquidation Report
export const MOOE_TABLE = 'MOOE liquidation report'