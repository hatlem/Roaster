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
    <footer className="bg-ink text-cream py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href={`/${country}`} className="font-display text-2xl font-bold">
              Roaster
            </Link>
            <p className="text-cream/60 mt-4 text-sm">
              {dictionary.metadata.description}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">{footer.product}</h4>
            <ul className="space-y-2 text-sm text-cream/60">
              <li>
                <Link href={`/${country}/features`} className="hover:text-cream transition-colors">
                  {nav.features}
                </Link>
              </li>
              <li>
                <Link href={`/${country}/pricing`} className="hover:text-cream transition-colors">
                  {nav.pricing}
                </Link>
              </li>
              <li>
                <Link href={`/${country}/industries`} className="hover:text-cream transition-colors">
                  {nav.industries}
                </Link>
              </li>
              <li>
                <Link href={`/${country}/customers`} className="hover:text-cream transition-colors">
                  {nav.customers}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">{footer.company}</h4>
            <ul className="space-y-2 text-sm text-cream/60">
              <li>
                <Link href={`/${country}/about`} className="hover:text-cream transition-colors">
                  {nav.about}
                </Link>
              </li>
              <li>
                <Link href={`/${country}/contact`} className="hover:text-cream transition-colors">
                  {footer.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">{footer.legal}</h4>
            <ul className="space-y-2 text-sm text-cream/60">
              <li>
                <Link href={`/${country}/privacy`} className="hover:text-cream transition-colors">
                  {footer.privacy}
                </Link>
              </li>
              <li>
                <Link href={`/${country}/terms`} className="hover:text-cream transition-colors">
                  {footer.terms}
                </Link>
              </li>
              <li>
                <Link href={`/${country}/cookies`} className="hover:text-cream transition-colors">
                  {footer.cookies}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cream/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-cream/40">
            &copy; {currentYear} Roaster. {footer.copyright}
          </p>
          <div className="flex items-center gap-6">
            <a href="https://twitter.com/roasterapp" className="text-cream/40 hover:text-cream transition-colors">
              <i className="fab fa-twitter" />
            </a>
            <a href="https://linkedin.com/company/roasterapp" className="text-cream/40 hover:text-cream transition-colors">
              <i className="fab fa-linkedin" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
