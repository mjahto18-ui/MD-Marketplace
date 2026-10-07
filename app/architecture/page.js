// app/architecture/page.js
'use client'
import { useState } from 'react'

const modules = [
  { name: 'app/page.js', type: 'home', files: 1, color: '#3b82f6' },
  { name: 'app/layout.js', type: 'core', files: 1, color: '#1e40af' },
  { name: 'app/dashboard', type: 'dashboard', files: 45, color: '#10b981' },
  { name: 'app/admin', type: 'admin', files: 32, color: '#ef4444' },
  { name: 'app/api', type: 'api', files: 68, color: '#f59e0b' },
  { name: 'app/components', type: 'shared', files: 28, color: '#8b5cf6' },
  { name: 'app/lib/supabase', type: 'db', files: 12, color: '#06b6d4' },
  { name: 'app/utils', type: 'utils', files: 17, color: '#ec4899' },
]

export default function ArchitecturePage() {
  const [selected, setSelected] = useState(null)
  
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui', background: '#f9fafb', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>MD Marketplace - خريطة المشروع</h1>
      <p>204 ملفات - اضغط على أي مربع</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
        {modules.map((m) => (
          <div
            key={m.name}
            onClick={() => setSelected(m)}
            style={{
              background: 'white',
              borderLeft: `6px solid ${m.color}`,
              padding: '16px',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: selected?.name === m.name ? `0 0 0 3px ${m.color}` : '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{m.name}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{m.files} ملف</div>
            <div style={{ marginTop: '8px', height: '6px', background: '#e5e7eb', borderRadius: '10px' }}>
              <div style={{ width: `${(m.files/68)*100}%`, height: '100%', background: m.color, borderRadius: '10px' }} />
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ marginTop: '24px', background: 'white', padding: '20px', borderRadius: '12px' }}>
          <h3>{selected.name}</h3>
          <p>النوع: {selected.type} - {selected.files} ملف</p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            {selected.type === 'api' && 'كل الـ API routes يلي بتتعامل مع Supabase و Google Sheets'}
            {selected.type === 'dashboard' && 'لوحة تحكم التاجر - المنتجات والطلبات والباركود'}
            {selected.type === 'admin' && 'لوحة الأدمن - إدارة التجار والموافقات'}
          </p>
        </div>
      )}

      <div style={{ marginTop: '32px', padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
        <strong>بدك الخريطة الحقيقية بـ SVG؟</strong><br/>
        افتح VS Code، اضغط <code>Ctrl+J</code> واكتب:<br/>
        <code style={{ background: 'black', color: 'lime', padding: '4px 8px', borderRadius: '4px' }}>npm run draw-graph</code>
      </div>
    </div>
  )
}
