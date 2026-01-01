import Link from "next/link";
import { company, navigation } from "@/content";

export function Footer() {
  return (
    <footer className="bg-ink text-cream/60 py-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cream/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-cream" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-2xl font-display font-medium text-cream">{company.name}</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              {company.tagline}
            </p>
            {company.social.linkedin || company.social.twitter ? (
              <div className="flex gap-4">
                {company.social.linkedin && (
                  <a
                    href={company.social.linkedin}
                    className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                )}
                {company.social.twitter && (
                  <a
                    href={company.social.twitter}
                    className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
              </div>
            ) : null}
          </div>

          {/* Product */}
          <div>
            <h4 className="text-cream font-semibold mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
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
            <h4 className="text-cream font-semibold mb-4">Resources</h4>
            <ul className="space-y-3 text-sm">
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
            <h4 className="text-cream font-semibold mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
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
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            &copy; {company.year} {company.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            {navigation.footer.legal.map((item) => (
              <Link key={item.name} href={item.href} className="hover:text-cream transition-colors">
                {item.name}
              </Link>
            ))}
            <span className="text-cream/30">|</span>
            <span className="text-cream/40">Made in Norway</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
