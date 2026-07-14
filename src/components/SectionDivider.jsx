/* Ornamental centered section label — icy hairlines flanking a small
   icon + caps label. Shared by both card faces. */
export default function SectionDivider({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-sky-400/35 to-emerald-500/50" />
      <span className="flex shrink-0 items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-accent">
        {Icon && <Icon size={11} className="text-emerald-500" />}
        {children}
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-sky-400/35 to-emerald-500/50" />
    </div>
  )
}
