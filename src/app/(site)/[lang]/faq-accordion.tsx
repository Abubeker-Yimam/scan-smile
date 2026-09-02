export function FaqAccordion({
  items,
  heading,
  subtitle,
}: {
  items: { q: string; a: string }[];
  heading: string;
  subtitle: string;
}) {
  return (
    <section className="mt-16 border-t border-cotton/10 pt-12 sm:mt-32 sm:pt-16">
      <div className="max-w-[36rem]">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        <p className="mt-3 font-body text-cotton/70">{subtitle}</p>
      </div>

      <div className="mt-10 divide-y divide-cotton/10 border-y border-cotton/10">
        {items.map((faq, index) => (
          <details
            key={index}
            className="group py-6 [&::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold text-cotton transition-colors select-none group-open:text-gold sm:text-xl">
              <span>{faq.q}</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cotton/20 text-cotton/60 transition-transform duration-200 group-open:rotate-45 group-open:border-gold group-open:text-gold">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
            </summary>
            <div className="mt-4 max-w-[44rem] font-body text-sm leading-relaxed text-cotton/70 sm:text-base">
              <p>{faq.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
