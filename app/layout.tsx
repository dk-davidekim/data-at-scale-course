import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Data Management at Scale · DX604',description:'Tutorials, SQL practice, homework, and course discussions for Data Management at Scale.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="stylesheet" href="/styles.css"/></head><body>{children}</body></html>}
