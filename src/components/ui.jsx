import { colors, radius, font } from '../theme/tokens'

// Conteneur d'écran responsive.
// mobile  : occupe toute la largeur disponible
// tablet  : carte centrée, largeur confortable
// desktop : carte centrée plus large
// Le "cadre" visuel (fond vert + carte) ne s'affiche qu'à partir de la tablette ;
// sur mobile le contenu remplit l'écran pour un vrai rendu d'app.
export function Screen({ children, bp = 'mobile', wide = false }) {
  const isMobile = bp === 'mobile'
  const maxW = wide ? (bp === 'desktop' ? 760 : 640) : bp === 'desktop' ? 560 : 480

  if (isMobile) {
    return (
      <div style={{
        background: colors.green.surface, borderRadius: radius.card,
        padding: '20px 18px 22px', fontFamily: font.family, width: '100%',
        flex: 1, display: 'flex', flexDirection: 'column',
      }}>
        {children}
      </div>
    )
  }

  return (
    <div style={{
      background: colors.green.surface, borderRadius: radius.card,
      padding: bp === 'desktop' ? '32px 36px 36px' : '26px 28px 30px',
      fontFamily: font.family, width: '100%', maxWidth: maxW, margin: '0 auto',
      border: `0.5px solid ${colors.border.soft}`,
    }}>
      {children}
    </div>
  )
}

// Alias rétrocompatible : certains écrans importent encore PhoneFrame.
export function PhoneFrame({ children }) {
  return <Screen bp="mobile">{children}</Screen>
}

export function ScreenHeader({ title, subtitle, onBack, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack && (
          <button onClick={onBack} aria-label="Retour"
            style={{
              width: 34, height: 34, borderRadius: '50%', border: 'none',
              background: colors.green.soft, color: colors.green.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </button>
        )}
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: colors.text.title }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: colors.text.soft }}>{subtitle}</div>}
        </div>
      </div>
      {right}
    </div>
  )
}

export function StreakBadge({ children, icon = 'ti-seedling' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: colors.green.softer, color: colors.green.primaryDark,
      fontSize: 12, fontWeight: 600, padding: '6px 11px', borderRadius: radius.pill,
    }}>
      <i className={`ti ${icon}`} aria-hidden="true" /> {children}
    </div>
  )
}

export function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', background: colors.green.soft, borderRadius: radius.md, padding: 4, marginBottom: 18 }}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            style={{
              flex: 1, fontSize: 12.5, padding: '8px 0', border: 'none',
              background: active ? colors.green.surface : 'transparent',
              color: active ? colors.text.title : colors.text.soft,
              fontWeight: active ? 600 : 400, borderRadius: radius.sm,
            }}>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function Chip({ children, active, variant = 'amber', onClick, style }) {
  const palettes = {
    amber: { bg: colors.amber.bg, border: colors.amber.border, text: colors.amber.text },
    green: { bg: colors.green.soft, border: colors.border.leaf, text: colors.green.primaryDark },
  }
  const p = palettes[variant]
  return (
    <button onClick={onClick}
      style={{
        fontSize: 13, padding: '7px 13px', borderRadius: radius.xl, cursor: 'pointer',
        border: `1.5px solid ${active ? p.border : colors.border.soft}`,
        background: active ? p.bg : 'transparent',
        color: active ? p.text : colors.text.muted,
        ...style,
      }}>
      {children}
    </button>
  )
}

export function PrimaryButton({ children, icon, onClick, dark }) {
  return (
    <button onClick={onClick}
      style={{
        width: '100%', border: 'none',
        background: dark ? colors.clinical.ink : colors.green.primary,
        color: '#fff', padding: 14, borderRadius: radius.lg, fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      }}>
      {icon && <i className={`ti ${icon}`} aria-hidden="true" />} {children}
    </button>
  )
}

export function Toggle({ on }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 42, height: 24, flexShrink: 0 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: 20,
        background: on ? colors.green.primary : '#D3D1C7', transition: 'background .2s',
      }} />
      <span style={{
        position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18,
        background: '#fff', borderRadius: '50%', transition: 'left .2s',
      }} />
    </span>
  )
}
