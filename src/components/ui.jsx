import { useState, useEffect, useRef } from 'react'
import { colors, radius, font } from '../theme/tokens'

// Conteneur d'écran responsive.
export function Screen({ children, bp = 'mobile', wide = false }) {
  const isMobile = bp === 'mobile'
  const maxW = wide ? (bp === 'desktop' ? 760 : 640) : bp === 'desktop' ? 560 : 480

  if (isMobile) {
    return (
      <div className="anim-fadeIn" style={{
        background: colors.green.surface, borderRadius: radius.card,
        padding: '20px 18px 22px', fontFamily: font.family, width: '100%',
        flex: 1, display: 'flex', flexDirection: 'column',
      }}>
        {children}
      </div>
    )
  }

  return (
    <div className="anim-fadeIn" style={{
      background: colors.green.surface, borderRadius: radius.card,
      padding: bp === 'desktop' ? '32px 36px 36px' : '26px 28px 30px',
      fontFamily: font.family, width: '100%', maxWidth: maxW, margin: '0 auto',
      border: `0.5px solid ${colors.border.soft}`,
      display: 'flex', flexDirection: 'column',
    }}>
      {children}
    </div>
  )
}

// Alias rétrocompatible
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
    <div className="anim-popIn" style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: colors.green.softer, color: colors.green.primaryDark,
      fontSize: 12, fontWeight: 600, padding: '6px 11px', borderRadius: radius.pill,
    }}>
      <i className={`ti ${icon}`} aria-hidden="true" /> {children}
    </div>
  )
}

export function Segmented({ options, value, onChange, variant = 'garden' }) {
  const isClinical = variant === 'clinical'
  const trackBg = isClinical ? colors.clinical.surfaceSoft : colors.green.soft
  const activeBg = isClinical ? colors.clinical.surface : colors.green.surface
  const activeColor = isClinical ? colors.clinical.ink : colors.text.title
  const inactiveColor = isClinical ? colors.text.muted : colors.text.soft

  return (
    <div style={{ display: 'flex', background: trackBg, borderRadius: radius.md, padding: 4, marginBottom: 18 }}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            style={{
              flex: 1, fontSize: 12.5, padding: '8px 0', border: 'none',
              background: active ? activeBg : 'transparent',
              color: active ? activeColor : inactiveColor,
              fontWeight: active ? 600 : 400, borderRadius: radius.sm,
              transition: 'background .25s ease, color .2s ease, font-weight .15s ease',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
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
        transition: 'all .2s ease',
        transform: active ? 'scale(1.03)' : 'scale(1)',
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
        transition: 'transform .15s ease, box-shadow .2s ease',
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
        background: on ? colors.green.primary : '#D3D1C7',
        transition: 'background .25s cubic-bezier(.4,0,.2,1)',
      }} />
      <span style={{
        position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18,
        background: '#fff', borderRadius: '50%',
        transition: 'left .25s cubic-bezier(.4,0,.2,1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </span>
  )
}

// Animated number counter — counts from 0 (or previous) to target
export function AnimatedNumber({ value, duration = 600, suffix = '' }) {
  const numVal = parseFloat(String(value).replace(',', '.'))
  const isNum = !isNaN(numVal)
  const [display, setDisplay] = useState(isNum ? 0 : value)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const fromRef = useRef(0)

  useEffect(() => {
    if (!isNum) { setDisplay(value); return }
    fromRef.current = typeof display === 'number' ? display : 0
    startRef.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    function step(ts) {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = fromRef.current + (numVal - fromRef.current) * eased
      setDisplay(current)
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [numVal]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isNum) return <>{value}{suffix}</>
  const formatted = Number.isInteger(numVal)
    ? String(Math.round(display))
    : (Math.round(display * 10) / 10).toString().replace('.', ',')
  return <>{formatted}{suffix}</>
}
