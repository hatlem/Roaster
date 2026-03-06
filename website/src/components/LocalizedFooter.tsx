import Link from 'next/link';
import type { Dictionary } from '@/i18n/dictionaries';

interface LocalizedFooterProps {
  dictionary: Dictionary;
  country: string;
}

export function LocalizedFooter({ dictionary, country }: LocalizedFooterProps) {
  const { nav, footer } = dictionary;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-warm-dark text-cream/50 overflow-hidden noise-bg">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-terracotta via-gold to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link href={`/${country}`} className="font-display text-2xl font-bold text-cream hover:text-terracotta transition-colors duration-300 block mb-4">
              Roaster
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              {dictionary.metadata.description}
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a href="https://twitter.com/roasterapp" className="text-cream/30 hover:text-cream/70 transition-colors duration-200">
                <i className="fab fa-twitter" />
              </a>
              <a href="https://linkedin.com/company/roasterapp" className="text-cream/30 hover:text-cream/70 transition-colors duration-200">
                <i className="fab fa-linkedin" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="md:col-span-2 md:col-start-7">
            <h4 className="text-cream/80 text-xs font-semibold mb-4 uppercase tracking-widest">{footer.product}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/features" className="hover:text-cream transition-colors duration-200">
                  {nav.features}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-cream transition-colors duration-200">
                  {nav.pricing}
                </Link>
              </li>
              <li>
                <Link href="/industries" className="hover:text-cream transition-colors duration-200">
                  {nav.industries}
                </Link>
              </li>
              <li>
                <Link href="/customers" className="hover:text-cream transition-colors duration-200">
                  {nav.customers}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="md:col-span-2">
            <h4 className="text-cream/80 text-xs font-semibold mb-4 uppercase tracking-widest">{footer.company}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-cream transition-colors duration-200">
                  {nav.about}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-cream transition-colors duration-200">
                  {footer.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <h4 className="text-cream/80 text-xs font-semibold mb-4 uppercase tracking-widest">{footer.legal}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-cream transition-colors duration-200">
                  {footer.privacy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-cream transition-colors duration-200">
                  {footer.terms}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-cream transition-colors duration-200">
                  {footer.cookies}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-cream/8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-cream/30">
          <p>
            &copy; {currentYear} Roaster. {footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
