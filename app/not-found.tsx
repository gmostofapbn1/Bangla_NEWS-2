import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { getSiteSettings } from "@/lib/settings";

/**
 * Reads the live branding rather than rendering a bare <Logo />, which fell
 * back to the hard-coded name and left the old brand on the 404 page.
 */
export default async function NotFound() {
  const settings = await getSiteSettings();

  return (
    <div className="grid min-h-screen place-items-center bg-grain px-4 text-center">
      <div>
        <div className="mb-6 flex justify-center">
          <Logo src={settings.site_logo || null} name={settings.site_name} />
        </div>
        <p className="font-serif text-6xl font-semibold text-accent">404</p>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-ink">
          Page not found
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          The page you’re looking for doesn’t exist or has moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
