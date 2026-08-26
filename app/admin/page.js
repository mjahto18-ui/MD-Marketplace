"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function AdminTest() {
  const [data, setData] = useState([])
  const [errorMsg, setErrorMsg] = useState("")
  const [envOk, setEnvOk] = useState("checking...")

  useEffect(() => {
    async function load() {
      const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY

      setEnvOk(`url: ${!!url} | key: ${!!key} | url value: ${url?.substring(0,20)}...`)

      if (!url || !key) {
        setErrorMsg(`ENV ناقص - url: ${!!url} key: ${!!key}`)
        return
      }

      try {
        const supabase = createClient(url, key)
        const { data, error } = await supabase.from("customers").select("*").limit(5)
        if (error) setErrorMsg(error.message)
        else setData(data || [])
      } catch (e) {
        setErrorMsg(e.message)
      }
    }
    load()
  }, [])

  return (
    <div style={{padding: 20, fontFamily: 'monospace'}}>
      <h1>Test Customers - {data.length} rows</h1>
      <p>ENV: {envOk}</p>
      {errorMsg && <p style={{color:'red', background:'#fee', padding:10}}>Error: {errorMsg}</p>}
      <pre style={{background:'#f5f5f5', padding:15}}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
