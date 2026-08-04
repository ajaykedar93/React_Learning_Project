import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://erwcxgpblinpjfnrvxbe.supabase.co";

const supabase = createClient(
  supabaseUrl,
  "sb_publishable_ETbIaw_AcMSRxQ6oPDDUZw_Ce4U_sC0"
);

export default supabase;