import Link from "next/link"
export default function BackToDashboard(){
  return (
    <Link href="/admin/dashboard" className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-bold mb-4 hover:bg-gray-800">
      ← رجوع للداشبورد
    </Link>
  )
}
