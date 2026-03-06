import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <p className="font-display text-8xl text-terracotta mb-4">404</p>
        <h1 className="font-display text-3xl mb-4">Page not found</h1>
        <p className="text-ink/60 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Go home
          </Link>
          <Link href="/contact" className="btn-secondary">
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
