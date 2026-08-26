"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AdminTest() {
  const [data, setData] = useState([])

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("customers").select("*").limit(5)
      console.log("DATA:", data, "ERROR:", error)
      setData(data || [])
    }
    load()
  }, [])

  return (
    <div style={{padding: 20}}>
      <h1>Test Customers - {data.length} rows</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
