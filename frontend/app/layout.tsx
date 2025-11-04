import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clay Cloud - Free Cloud Computing',
  description: 'Free cloud computing with automated account management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

