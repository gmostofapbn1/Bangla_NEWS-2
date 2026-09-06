import Link from "next/link";
import { getSiteSettings, socialLinks } from "@/lib/settings";
import { SocialIcon } from "./social-icons";
import { SITE } from "@/lib/site-config";

/**
 * Footer.
 *
 * A dark band that closes the page: a centred "Follow Our Social Media" block,
 * an app download badge, then a single row of legal links. Deliberately not the
 * multi-column directory index — the header mega-menu already covers browsing,
 * and repeating it here made the footer taller than the content on short pages.
 *
 * The same markup serves both breakpoints: the social row and the link row wrap
 * on their own, so mobile stacks without a separate layout.
 */
export async function SiteFooter() {
  const settings = await getSiteSettings();
  const socials = socialLinks(settings);
  const appUrl = settings.app_download_url.trim();

  return (
    // `mt-auto` pins the footer to the bottom on short pages: the site layout is
    // a full-height flex column, so leftover space collapses above it rather
    // than leaving it stranded mid-screen.
    <footer className="mt-auto bg-[#101319] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Social + app: side by side on desktop, stacked and centred below. */}
        <div className="flex flex-col items-center gap-10 text-center md:flex-row md:items-start md:justify-between md:gap-8 md:text-left">
          {socials.length > 0 && (
            <div className="md:flex-1">
              <h2 className="text-sm font-semibold tracking-wide text-white">
                Follow Our Social Media
              </h2>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="grid h-11 w-11 place-items-center rounded-lg bg-white/5 text-white/85 ring-1 ring-white/10 transition hover:bg-accent hover:text-white hover:ring-accent"
                  >
                    <SocialIcon name={s.key} className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {appUrl && (
            <div className="md:flex-1 md:text-right">
              <h2 className="text-sm font-semibold tracking-wide text-white">
                Download App For Easy
              </h2>
              <div className="mt-4 flex justify-center md:justify-end">
                <a
                  href={appUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 rounded-xl bg-black px-5 py-2.5 ring-1 ring-white/15 transition hover:ring-white/35"
                >
                  <GooglePlayMark />
                  <span className="text-left leading-tight">
                    <span className="block text-[10px] uppercase tracking-wider text-white/70">
                      Get it on
                    </span>
                    <span className="block text-base font-semibold text-white">
                      Google Play
                    </span>
                  </span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Legal row */}
        <div className="mt-10 flex flex-col items-center gap-4 border-t border-white/10 pt-6 text-center md:flex-row md:justify-between md:text-left">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <FooterLink href="/about">About us</FooterLink>
            {settings.contact_email ? (
              <a
                href={`mailto:${settings.contact_email}`}
                className="text-sm text-white/70 transition hover:text-white"
              >
                Contact us
              </a>
            ) : (
              <FooterLink href="/submit">Contact us</FooterLink>
            )}
            <FooterLink href="/disclaimer">Disclaimer</FooterLink>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/sitemap.xml">Sitemap</FooterLink>
          </nav>

          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} {settings.site_name || SITE.name}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-white/70 transition hover:text-white">
      {children}
    </Link>
  );
}

/** Google Play's triangular play mark, drawn rather than loaded as an asset. */
function GooglePlayMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden="true">
      <path d="M3.6 2.3a1 1 0 0 0-.6.9v17.6a1 1 0 0 0 .6.9l9.4-9.7L3.6 2.3Z" fill="#00D2FF" />
      <path d="M17.2 8.2 5.4 1.5a1 1 0 0 0-1 0l9.6 9.9 3.2-3.2Z" fill="#00F076" />
      <path d="M17.2 15.8 14 12.6l-9.6 9.9a1 1 0 0 0 1 0l11.8-6.7Z" fill="#FF3A44" />
      <path d="m17.2 8.2-3.2 3.2 3.2 3.2 3.6-2.1a1 1 0 0 0 0-1.7l-3.6-2.6Z" fill="#FFC900" />
    </svg>
  );
}
