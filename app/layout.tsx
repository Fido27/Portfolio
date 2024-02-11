import './globals.css'

export const metadata = {
  title: "Aarav's Portfolio",
  description: "Aarav's Portfolio created using Next.js",
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