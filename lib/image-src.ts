import { IMAGE_HOSTS } from "./image-hosts";

/** Whether next/image may optimise this src; otherwise pass `unoptimized`. */
export function optimizable(src: string): boolean {
  try {
    return IMAGE_HOSTS.includes(new URL(src).hostname);
  } catch {
    return src.startsWith("/");
  }
}
