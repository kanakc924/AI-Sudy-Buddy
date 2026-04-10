import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import 'katex/dist/katex.min.css'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from 'next-themes'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'AI Study Buddy — Study Smarter',
  description: 'AI-powered flashcards, quizzes and summaries from your notes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.add(t);}catch(e){}`,
          }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${dmSans.variable} ${playfair.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}