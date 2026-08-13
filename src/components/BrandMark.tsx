/** STYLE SCOLÉA — Le symbole généré « pages en S » est la signature du Cahier de direction contemporain ; il reste visible, jamais réduit à des initiales génériques. */
export function BrandMark({ withName = true, light = false }: { withName?: boolean; light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/manus-storage/scolea-mark_192105b7.png" alt="" className="h-10 w-10 object-contain" />
      {withName && <div className={`font-display text-[1.55rem] leading-none tracking-tight ${light ? 'text-white' : 'text-ink'}`}>Scol<span className="text-saffron">é</span>a<span className="text-saffron">.</span></div>}
    </div>
  );
}
