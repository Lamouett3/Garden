import { useState, useEffect, useRef, createContext, useContext, useCallback, Component } from 'react'
import { colors, radius, font, shadow } from '../theme/tokens'

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
      boxShadow: shadow.md,
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
      boxShadow: shadow.xs,
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
    <div role="tablist" style={{ display: 'flex', background: trackBg, borderRadius: radius.md, padding: 4, marginBottom: 18, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button key={opt.value} role="tab" aria-selected={active} onClick={() => onChange(opt.value)}
            style={{
              flex: 1, fontSize: 12.5, padding: '8px 0', border: 'none',
              background: active ? activeBg : 'transparent',
              color: active ? activeColor : inactiveColor,
              fontWeight: active ? 600 : 400, borderRadius: radius.sm,
              transition: 'background .25s ease, color .2s ease, font-weight .15s ease',
              boxShadow: active ? shadow.sm : 'none',
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
    <button onClick={onClick} aria-pressed={active}
      style={{
        fontSize: 13, padding: '7px 13px', borderRadius: radius.xl, cursor: 'pointer',
        border: `1.5px solid ${active ? p.border : colors.border.soft}`,
        background: active ? p.bg : 'transparent',
        color: active ? p.text : colors.text.muted,
        transition: 'all .2s ease',
        transform: active ? 'scale(1.03)' : 'scale(1)',
        boxShadow: active ? shadow.sm : 'none',
        ...style,
      }}>
      {children}
    </button>
  )
}

export function PrimaryButton({ children, icon, onClick, dark, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{
        width: '100%', border: 'none',
        background: dark ? colors.clinical.ink : colors.green.primary,
        color: '#fff', padding: 14, borderRadius: radius.lg, fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        transition: 'transform .15s ease, box-shadow .2s ease, opacity .2s ease',
        boxShadow: disabled ? 'none' : shadow.button,
        opacity: disabled ? 0.6 : 1, cursor: disabled ? 'default' : 'pointer',
      }}>
      {icon && <i className={`ti ${icon}`} aria-hidden="true" />} {children}
    </button>
  )
}

export function Toggle({ on }) {
  return (
    <span role="switch" aria-checked={on} style={{ position: 'relative', display: 'inline-block', width: 42, height: 24, flexShrink: 0 }}>
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

// ---- Error Boundary ----
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error, info) {
    console.error('Pousse — erreur de rendu :', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#d9e3da', fontFamily: font.family, padding: 24,
        }}>
          <div style={{
            background: colors.green.surface, borderRadius: radius.card, padding: '40px 32px',
            maxWidth: 380, textAlign: 'center',
          }}>
            <i className="ti ti-plant-off" style={{ fontSize: 40, color: colors.text.soft }} aria-hidden="true" />
            <h2 style={{ fontSize: 18, color: colors.text.title, margin: '16px 0 8px' }}>
              Oups, quelque chose a plante
            </h2>
            <p style={{ fontSize: 13, color: colors.text.muted, lineHeight: 1.6, marginBottom: 20 }}>
              Une erreur inattendue s'est produite. Tes donnees sont en securite.
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
              style={{
                border: 'none', background: colors.green.primary, color: '#fff',
                padding: '12px 24px', borderRadius: radius.lg, fontSize: 14,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 7,
              }}>
              <i className="ti ti-refresh" aria-hidden="true" /> Recharger
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ---- Toast notification system ----
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div aria-live="polite" style={{
        position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999,
        pointerEvents: 'none', width: '90%', maxWidth: 380,
      }}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const TOAST_STYLES = {
  success: { bg: colors.green.soft, border: colors.green.leaf, color: colors.green.primaryDark, icon: 'ti-check' },
  error: { bg: '#FDF0F0', border: '#D06050', color: '#8B2020', icon: 'ti-alert-triangle' },
  info: { bg: colors.sand.bg, border: colors.sand.faint, color: colors.sand.text, icon: 'ti-info-circle' },
}

function ToastItem({ toast, onDismiss }) {
  const s = TOAST_STYLES[toast.type] || TOAST_STYLES.info
  return (
    <div className="anim-fadeInUp" style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: radius.md,
      padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 9,
      boxShadow: shadow.lg, pointerEvents: 'auto',
    }}>
      <i className={`ti ${s.icon}`} style={{ fontSize: 16, color: s.color, flexShrink: 0 }} aria-hidden="true" />
      <span style={{ fontSize: 13, color: s.color, flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button onClick={onDismiss} aria-label="Fermer" style={{
        border: 'none', background: 'transparent', padding: 2, color: s.color, opacity: 0.5,
        fontSize: 14, flexShrink: 0,
      }}>
        <i className="ti ti-x" aria-hidden="true" />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) return () => {} // graceful fallback
  return ctx
}

// ---- Confirmation Dialog ----
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', onConfirm, onCancel, danger }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)', padding: 20,
    }} onClick={onCancel} role="presentation">
      <div className="anim-scaleIn" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} style={{
        background: colors.green.surface, borderRadius: radius.lg, padding: '24px 22px',
        maxWidth: 340, width: '100%', boxShadow: shadow.xl,
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: colors.text.title, marginBottom: 8 }}>{title}</div>
        <p style={{ fontSize: 13, color: colors.text.muted, lineHeight: 1.6, margin: '0 0 20px' }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, border: `1.5px solid ${colors.border.soft}`, background: 'transparent',
            color: colors.text.muted, padding: 11, borderRadius: radius.md, fontSize: 13, fontFamily: 'inherit',
          }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, border: 'none',
            background: danger ? '#D06050' : colors.green.primary,
            color: '#fff', padding: 11, borderRadius: radius.md, fontSize: 13,
            fontWeight: 600, fontFamily: 'inherit',
            boxShadow: shadow.button,
          }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
