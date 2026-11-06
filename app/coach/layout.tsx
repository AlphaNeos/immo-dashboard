import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Mon Coach',
  description: 'Routine, sommeil, sport et objectifs perso',
  manifest: '/coach.webmanifest',
  icons: { icon: '/coach-icon-192.png', apple: '/coach-icon-180.png' },
  appleWebApp: { capable: true, title: 'Coach', statusBarStyle: 'black-translucent' },
}
export const viewport: Viewport = { themeColor: '#0F172A', width: 'device-width', initialScale: 1 }

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return children
}
