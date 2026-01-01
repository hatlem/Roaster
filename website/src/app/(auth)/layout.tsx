import Link from "next/link";
import { company } from "@/content";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Simple header */}
      <header className="p-6">
        <Link href="/" className="flex items-center gap-3 w-fit">
          <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-cream" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-2xl font-display font-medium">{company.name}</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </main>

      {/* Simple footer */}
      <footer className="p-6 text-center text-ink/40 text-sm">
        &copy; {company.year} {company.name}. All rights reserved.
      </footer>
    </div>
  );
}
