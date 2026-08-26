export const dynamic = 'force-dynamic'
export const revalidate = 0

"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function AdminTest() {
  const [data, setData] = useState([])
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    async function load() {
      // بيقرا الاسمين يلي عندك + الاسمين الجداد - شو ما كان موجود بياخدو
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        setErrorMsg(`ما لقى ENV - url: ${!!url} key: ${!!key}`)
        return
      }

      const supabase = createClient(url, key)
      const { data, error } = await supabase.from("customers").select("*").limit(5)
      
      if (error) setErrorMsg(error.message)
      setData(data || [])
      console.log("DATA:", data, "ERROR:", error)
    }
    load()
  }, [])

  return (
    <div style={{padding: 20}}>
      <h1>Test Customers - {data.length} rows</h1>
      {errorMsg && <p style={{color:'red'}}>Error: {errorMsg}</p>}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
