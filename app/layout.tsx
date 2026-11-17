import type { Metadata } from 'next'
import './globals.css'
import '@/lib/env'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'TaskFlow',
  description: 'Task management for teams',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: `
        (function () {
          var theme;
          try { theme = localStorage.getItem('theme'); } catch (error) {}
          var dark = theme === 'dark' || (theme !== 'light' && theme !== 'dark' && window.matchMedia('(prefers-color-scheme: dark)').matches);
          document.documentElement.classList.toggle('dark', dark);
        })();
      ` }} />
    </head>
    <body className="font-sans"><Providers>{children}</Providers></body>
  </html>
}
