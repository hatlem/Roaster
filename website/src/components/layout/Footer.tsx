import Link from "next/link";
import { company, navigation } from "@/content";

export function Footer() {
  return (
    <footer className="bg-ink text-cream/60 py-12">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <Link href="/" className="text-xl font-display text-cream mb-3 block">
              {company.name}
            </Link>
            <p className="text-sm leading-relaxed">
              {company.tagline}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-cream text-sm font-semibold mb-3 uppercase tracking-wide">Product</h4>
            <ul className="space-y-2 text-sm">
              {navigation.footer.product.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:text-cream transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-cream text-sm font-semibold mb-3 uppercase tracking-wide">Resources</h4>
            <ul className="space-y-2 text-sm">
              {navigation.footer.resources.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:text-cream transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-cream text-sm font-semibold mb-3 uppercase tracking-wide">Company</h4>
            <ul className="space-y-2 text-sm">
              {navigation.footer.company.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:text-cream transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-cream/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-sm">
          <p>
            &copy; {company.year} {company.legalName}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {navigation.footer.legal.map((item) => (
              <Link key={item.name} href={item.href} className="hover:text-cream transition-colors">
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
