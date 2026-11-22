import { createClient } from "@supabase/supabase-js"
export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data, error } = await supabase
    .from('sub_categories')
    .select('id, "Category ID", "Sub Category Name"')
    .order('id', { ascending: true })
  if (error) return Response.json({ success: false, data: [], error: error.message })
  return Response.json({ success: true, data: data || [] })
}
