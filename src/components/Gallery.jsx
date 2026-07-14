import { GALLERY } from '../data/siteData.js'
import SectionDivider from './SectionDivider.jsx'
import { Camera } from 'lucide-react'

/**
 * Storefront / interior photo strip.
 * Renders nothing while GALLERY is empty — drop images into /public/gallery
 * and list them in siteData.js to activate this section.
 */
export default function Gallery({ className = '', onClick }) {
  if (!GALLERY.length) return null

  return (
    <section className={`section-surface relative ${className}`} onClick={onClick}>
      <SectionDivider icon={Camera}>Our Store</SectionDivider>
      <div className="no-scrollbar mt-2.5 -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
        {GALLERY.map((g) => (
          <img
            key={g.src}
            src={g.src}
            alt={g.alt}
            loading="lazy"
            decoding="async"
            className="h-24 w-36 shrink-0 rounded-xl object-cover shadow-md ring-1 ring-white/20"
          />
        ))}
      </div>
    </section>
  )
}
