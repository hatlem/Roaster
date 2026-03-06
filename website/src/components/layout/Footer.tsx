import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";

interface FooterProps {
  dictionary: Dictionary;
}

export function Footer({ dictionary }: FooterProps) {
  const { nav, footer, common } = dictionary;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-warm-dark text-cream/50 overflow-hidden grain">
      <div className="h-px bg-gradient-to-r from-terracotta via-gold to-transparent" />

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-4">
            <Link href="/" className="text-2xl font-display text-cream mb-4 block hover:text-terracotta transition-colors duration-300">
              Roaster
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              {dictionary.content.companyTagline}
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-cream/30">
              <span className="w-1.5 h-1.5 rounded-full bg-forest" />
              {dictionary.homePage.localSoftwareTitle}
            </div>
          </div>

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
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-cream/80 text-xs font-semibold mb-4 uppercase tracking-widest">{footer.resources}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/compliance-guide" className="hover:text-cream transition-colors duration-200">
                  {dictionary.complianceGuidePage.title}
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="hover:text-cream transition-colors duration-200">
                  {dictionary.apiDocsPage.metaTitle}
                </Link>
              </li>
            </ul>
          </div>

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
        </div>

        <div className="pt-8 border-t border-cream/8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-cream/30">
          <p>
            &copy; {currentYear} Getia AS. {footer.copyright}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="hover:text-cream/60 transition-colors duration-200">
              {footer.privacy}
            </Link>
            <Link href="/terms" className="hover:text-cream/60 transition-colors duration-200">
              {footer.terms}
            </Link>
            <Link href="/gdpr" className="hover:text-cream/60 transition-colors duration-200">
              {common.gdpr}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
