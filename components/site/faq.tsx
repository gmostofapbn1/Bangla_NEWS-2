import type { Faq } from "@/lib/faq";

/**
 * Question list.
 *
 * Native <details> rather than a JS accordion: the answers stay in the DOM and
 * in the accessibility tree whether or not they are expanded, so a crawler —
 * and a screen reader — reads the same text the FAQPage schema claims is here.
 * A JS accordion that mounts answers on click would break that.
 */
export function FaqList({ items, heading }: { items: Faq[]; heading: string }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="font-serif text-xl font-semibold leading-tight tracking-tight text-ink sm:text-2xl">
        {heading}
      </h2>
      <dl className="mt-5 divide-y divide-line">
        {items.map((it) => (
          <div key={it.q} className="py-1">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-[15px] font-medium text-ink">
                <dt>{it.q}</dt>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <dd className="pb-4 pr-8 text-sm leading-relaxed text-muted">{it.a}</dd>
            </details>
          </div>
        ))}
      </dl>
    </section>
  );
}
