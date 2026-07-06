import { Cairo } from 'next/font/google'
const cairo = Cairo({ subsets: ['arabic'], weight: ['400','700'] })

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>{children}</body>
    </html>
  )
}
