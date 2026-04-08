"use client";

export default function ProductWorkspaceShell({
  eyebrow = "Products",
  title,
  description,
  actions,
  stats = [],
  children,
}) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-[#ece4db] bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_45%,#eff6ff_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#f97316]">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
            {description ? (
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
            ) : null}
            {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
          </div>

          {stats.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="text-2xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                    {item.helper ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {item.helper}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="space-y-6">{children}</div>
    </div>
  );
}

export function ProductSurface({ className = "", children, ...props }) {
  return (
    <section
      {...props}
      className={`rounded-[24px] border border-[#ece4db] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-6 ${className}`.trim()}
    >
      {children}
    </section>
  );
}
