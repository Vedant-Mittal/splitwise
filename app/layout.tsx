import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { DbProvider } from './lib/dbContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Splitwise - Expense Sharing App',
  description: 'A simple expense splitting application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background dark:bg-background-dark text-text dark:text-text-dark`}>
        <DbProvider>
          <main className="container mx-auto px-4 py-8 max-w-4xl">
            {children}
          </main>
        </DbProvider>
      </body>
    </html>
  )
} 