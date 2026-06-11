import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

export const metadata: Metadata = {
	title: "Space Engineers Trade Tracker",
	description:
		"Track Space Engineers trade-only challenge runs with Supabase-backed trade tables.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="h-full antialiased">
			<Analytics />
			<body className="min-h-full">{children}</body>
		</html>
	);
}
