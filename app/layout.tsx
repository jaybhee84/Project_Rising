import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import UrgentBulletinAlert from '@/components/UrgentBulletinAlert'
import HymnPlayer from '@/components/HymnPlayer'

export const metadata: Metadata = {
  title: 'Isabela East Central Elementary School',
  description: 'Official website of IECES — SDO Isabela City, Basilan',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <UrgentBulletinAlert />
        <HymnPlayer />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
