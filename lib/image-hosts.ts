/**
 * Hosts whose images go through next/image optimisation. Shared by
 * next.config.ts and the runtime check, so the two cannot disagree - an image
 * from any other host is rendered unoptimised rather than failing.
 */
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();

export const IMAGE_HOSTS: string[] = [supabaseHost, "blogger.googleusercontent.com"].filter(Boolean);
