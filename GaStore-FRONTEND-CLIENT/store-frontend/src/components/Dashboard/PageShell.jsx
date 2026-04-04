"use client";

export const DashboardPageShell = ({ eyebrow, title, description, actions, children }) => {
  return (
    <div className="space-y-6 p-2 md:p-4">
      <section className="rounded-[32px] border border-[#f0dacc] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(255,245,236,0.95)_42%,_rgba(255,232,214,0.92)_100%)] p-6 shadow-[0_20px_70px_rgba(240,108,35,0.10)] md:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c2410c]">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 md:text-[2.4rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-gray-600 md:text-base">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>
      </section>

      {children}
    </div>
  );
};

export const DashboardPanel = ({ className = "", children }) => {
  return (
    <section
      className={`rounded-[30px] border border-[#ece4db] bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] md:p-6 ${className}`}
    >
      {children}
    </section>
  );
};

export const DashboardStatCard = ({ label, value, note, icon: Icon, tone = "bg-white text-gray-950" }) => {
  return (
    <div className={`rounded-[26px] border border-white/60 p-5 shadow-sm ${tone}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium opacity-80">{label}</div>
        {Icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/5">
            <Icon className="text-lg" />
          </div>
        ) : null}
      </div>
      <div className="mt-5 text-[1.9rem] font-semibold tracking-tight">{value}</div>
      {note ? <div className="mt-1 text-sm opacity-75">{note}</div> : null}
    </div>
  );
};
