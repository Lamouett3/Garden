import { useState } from 'react'
import { conditions, conditionKeys, durations, efficacyLevels } from '../data/conditions'
import { colors, radius } from '../theme/tokens'
import BodySilhouette from '../components/BodySilhouette'
import { Screen, ScreenHeader, Chip, PrimaryButton } from '../components/ui'
import { useStore } from '../data/store'

export default function LogEpisode({ onBack, onSaved, bp = 'mobile' }) {
  const { addEpisode } = useStore()
  const [condKey, setCondKey] = useState('migraine')
  const [zones, setZones] = useState([])
  const [intensity, setIntensity] = useState(5)
  const [duration, setDuration] = useState('2-4h')
  const [triggers, setTriggers] = useState([])
  const [treatment, setTreatment] = useState('Aucun')
  const [efficacy, setEfficacy] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [extra, setExtra] = useState([])

  const cond = conditions[condKey]
  const wide = bp === 'desktop'

  const switchCond = (k) => { setCondKey(k); setZones([]); setTriggers([]); setExtra([]) }
  const toggle = (val, list, setList) =>
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val])

  const showEfficacy = treatment !== 'Aucun'
  const treatmentOptions = ['Aucun', cond.treatment, 'Autre']

  const handleSave = () => {
    addEpisode({ condition: condKey, zones, intensity, duration, triggers, treatment, efficacy, extra })
    onSaved?.()
  }

  const silhouetteBlock = (
    <div>
      <Label>
        {'Ou ? '}
        {zones.length > 0 && (
          <span style={{ color: colors.sand.faint, fontSize: 12 }}>
            {'\u00b7 '}{zones.length} {zones.length > 1 ? 'zones' : 'zone'}
          </span>
        )}
      </Label>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <BodySilhouette suggested={cond.zones} active={zones} onToggle={(z) => toggle(z, zones, setZones)} />
      </div>
    </div>
  )

  const controlsBlock = (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: colors.text.muted }}>Intensite</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text.body }}>{intensity}/10</span>
      </div>
      <input type="range" min={0} max={10} step={1} value={intensity}
        onChange={(e) => setIntensity(Number(e.target.value))} style={{ width: '100%', marginBottom: 18 }} />

      <Label>Duree</Label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {durations.map((d) => {
          const active = d === duration
          return (
            <button key={d} onClick={() => setDuration(d)}
              style={{
                flex: 1, fontSize: 12, padding: '9px 0', borderRadius: radius.md, cursor: 'pointer',
                border: `1.5px solid ${active ? colors.border.leaf : colors.border.soft}`,
                background: active ? colors.green.soft : 'transparent',
                color: active ? colors.green.primaryDark : colors.text.muted,
              }}>
              {d}
            </button>
          )
        })}
      </div>

      <Label>Declencheurs possibles</Label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {cond.triggers.map((t) => (
          <Chip key={t} active={triggers.includes(t)} onClick={() => toggle(t, triggers, setTriggers)}>{t}</Chip>
        ))}
      </div>
    </div>
  )

  return (
    <Screen bp={bp} wide={wide}>
      <ScreenHeader title="Noter un episode" subtitle={formatNow()} onBack={onBack} />

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>
        {conditionKeys.map((k) => {
          const active = k === condKey
          return (
            <button key={k} onClick={() => switchCond(k)}
              style={{
                fontSize: 13, padding: '7px 14px', borderRadius: radius.pill, cursor: 'pointer',
                border: `1.5px solid ${active ? colors.green.primary : colors.border.soft}`,
                background: active ? colors.green.primary : 'transparent',
                color: active ? '#fff' : colors.text.muted,
              }}>
              {conditions[k].label}
            </button>
          )
        })}
      </div>

      {wide ? (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 28, alignItems: 'start' }}>
          {silhouetteBlock}
          {controlsBlock}
        </div>
      ) : (
        <>
          {silhouetteBlock}
          {controlsBlock}
        </>
      )}

      <Label>Traitement pris</Label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {treatmentOptions.map((m) => (
          <Chip key={m} active={treatment === m}
            onClick={() => { setTreatment(m); if (m === 'Aucun') setEfficacy(null) }}>{m}</Chip>
        ))}
      </div>

      {showEfficacy && (
        <div style={{ background: colors.sand.bg, borderRadius: radius.md, padding: '12px 14px', marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: colors.sand.text, marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-bell" aria-hidden="true" /> On te le redemandera dans quelques heures
          </div>
          <div style={{ fontSize: 13, color: colors.text.muted, marginBottom: 8 }}>
            {'A-t-il soulage ? '}<span style={{ color: colors.sand.faint, fontSize: 12 }}>{'\u2014 tu peux repondre plus tard'}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {efficacyLevels.map((lvl) => {
              const active = efficacy === lvl
              return (
                <button key={lvl} onClick={() => setEfficacy(lvl)}
                  style={{
                    flex: 1, fontSize: 12, padding: '8px 0', borderRadius: radius.md, cursor: 'pointer',
                    border: `1.5px solid ${active ? colors.border.leaf : colors.border.soft}`,
                    background: active ? colors.green.soft : colors.green.surface,
                    color: active ? colors.green.primaryDark : colors.text.muted,
                  }}>
                  {lvl}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {!showEfficacy && <div style={{ height: 18 }} />}

      <button onClick={() => setShowDetails((v) => !v)}
        style={{
          width: '100%', background: colors.sand.bg, borderRadius: radius.md, padding: '13px 14px',
          marginBottom: showDetails ? 12 : 18, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
        <span style={{ fontSize: 13, color: colors.sand.text, display: 'flex', alignItems: 'center', gap: 7 }}>
          <i className={`ti ${showDetails ? 'ti-minus' : 'ti-plus'}`} aria-hidden="true" /> {cond.extra.label}
        </span>
        <i className={`ti ${showDetails ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ color: colors.sand.faint }} aria-hidden="true" />
      </button>

      {showDetails && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
          {cond.extra.options.map((o) => (
            <Chip key={o} variant="green" active={extra.includes(o)} onClick={() => toggle(o, extra, setExtra)}>{o}</Chip>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />

      <PrimaryButton icon="ti-check" onClick={handleSave}>Enregistrer</PrimaryButton>
      <p style={{ textAlign: 'center', fontSize: 12, color: colors.text.faint, marginTop: 11, marginBottom: 0 }}>
        {"Saisie rapide \u00b7 l'efficacite se note plus tard"}
      </p>
    </Screen>
  )
}

function Label({ children }) {
  return <div style={{ fontSize: 13, color: colors.text.muted, marginBottom: 8 }}>{children}</div>
}

function formatNow() {
  const d = new Date()
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `aujourd'hui, ${time}`
}
