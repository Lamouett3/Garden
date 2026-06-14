import { useState } from 'react'
import { conditions, conditionKeys, durations, efficacyLevels, zoneLabels, genderFilteredTriggers } from '../data/conditions'
import { colors, radius } from '../theme/tokens'
import BodySilhouette from '../components/BodySilhouette'
import { Screen, ScreenHeader, Chip, PrimaryButton, useToast } from '../components/ui'
import { useStore } from '../data/store'

const COND_ICONS = {
  migraine: 'ti-brain', sii: 'ti-stomach', fibro: 'ti-ripple',
  endometriose: 'ti-droplet-half-2', eczema: 'ti-hand-finger',
  asthme: 'ti-lungs', arthrose: 'ti-bone', autre: 'ti-pencil',
}

export default function LogEpisode({ onBack, onSaved, bp = 'mobile' }) {
  const { addEpisode, profile } = useStore()
  const toast = useToast()
  const [condKey, setCondKey] = useState(null)
  const [search, setSearch] = useState('')
  const [zones, setZones] = useState([])
  const [intensity, setIntensity] = useState(5)
  const [duration, setDuration] = useState('2-4h')
  const [triggers, setTriggers] = useState([])
  const [treatment, setTreatment] = useState('Aucun')
  const [efficacy, setEfficacy] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [extra, setExtra] = useState([])
  const [customLabel, setCustomLabel] = useState('')
  const [customExtra, setCustomExtra] = useState('')
  const [saving, setSaving] = useState(false)

  const cond = condKey ? conditions[condKey] : null
  const wide = bp === 'desktop'

  const switchCond = (k) => { setCondKey(k); setSearch(''); setZones([]); setTriggers([]); setExtra([]); setCustomLabel(''); setCustomExtra('') }
  const toggle = (val, list, setList) =>
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val])

  const showEfficacy = treatment !== 'Aucun'
  const treatmentOptions = cond ? ['Aucun', cond.treatment, 'Autre'] : []

  // Filtrer les triggers selon le genre
  const hiddenTriggers = genderFilteredTriggers[profile.gender] || []
  const visibleTriggers = cond ? cond.triggers.filter((t) => !hiddenTriggers.includes(t)) : []

  // Conditions masquees selon le genre (endometriose masquee pour les hommes)
  const hiddenConditions = profile.gender === 'h' ? ['endometriose'] : []

  const handleSave = () => {
    if (!condKey || saving) return
    setSaving(true)
    const episode = { condition: condKey, zones, intensity, duration, triggers, treatment, efficacy, extra }
    if (cond.custom && customLabel) episode.customLabel = customLabel
    if (customExtra.trim()) episode.extra = [...extra, customExtra.trim()]
    const saved = addEpisode(episode)
    if (saved) {
      toast('Episode enregistre', 'success')
      setTimeout(() => onSaved?.(), 350)
    } else {
      setSaving(false)
    }
  }

  // Filtrage des conditions par recherche
  const q = search.toLowerCase().trim()
  const visibleKeys = conditionKeys.filter((k) => !hiddenConditions.includes(k))
  const filteredKeys = q
    ? visibleKeys.filter((k) => {
        const c = conditions[k]
        const haystack = [c.label, ...c.zones.map((z) => zoneLabels[z] || z), ...c.triggers, ...c.extra.options].join(' ').toLowerCase()
        return haystack.includes(q)
      })
    : visibleKeys

  const silhouetteBlock = cond && (
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

  const controlsBlock = cond && (
    <div>
      {/* Champ libre pour "Autre pathologie" */}
      {cond.custom && (
        <div style={{ marginBottom: 16 }}>
          <Label>Nom de ta pathologie</Label>
          <input type="text" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Ex. : lombalgie, acouphenes..."
            style={{
              width: '100%', padding: '10px 13px', fontSize: 13, fontFamily: 'inherit',
              border: `1.5px solid ${colors.border.soft}`, borderRadius: radius.sm,
              background: colors.green.surface, color: colors.text.body, boxSizing: 'border-box',
            }} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: colors.text.muted }}>Intensite</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text.body }}>{intensity}/10</span>
      </div>
      <input type="range" min={0} max={10} step={1} value={intensity} aria-label="Intensite de l'episode"
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
                fontFamily: 'inherit',
              }}>
              {d}
            </button>
          )
        })}
      </div>

      <Label>Declencheurs possibles</Label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {visibleTriggers.map((t) => (
          <Chip key={t} active={triggers.includes(t)} onClick={() => toggle(t, triggers, setTriggers)}>{t}</Chip>
        ))}
      </div>
    </div>
  )

  return (
    <Screen bp={bp} wide={wide}>
      <ScreenHeader title="Noter un episode" subtitle={formatNow()} onBack={onBack} />

      {/* Barre de recherche + selection de pathologie */}
      {!condKey ? (
        <div style={{ marginBottom: 18 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: colors.green.soft, borderRadius: radius.lg, padding: '10px 14px', marginBottom: 12,
          }}>
            <i className="ti ti-search" style={{ color: colors.text.faint, fontSize: 17 }} aria-hidden="true" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une pathologie, zone, symptome..."
              style={{
                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                fontSize: 13, color: colors.text.body, fontFamily: 'inherit',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ border: 'none', background: 'transparent', color: colors.text.faint, padding: 0, cursor: 'pointer' }}>
                <i className="ti ti-x" style={{ fontSize: 15 }} aria-hidden="true" />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredKeys.map((k, idx) => {
              const c = conditions[k]
              return (
                <button key={k} onClick={() => switchCond(k)}
                  className={`anim-fadeInUp anim-d${Math.min(idx + 1, 8)}`}
                  style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left',
                    background: colors.green.surface, border: `1.5px solid ${colors.border.soft}`,
                    borderRadius: radius.md, padding: '12px 14px', cursor: 'pointer', width: '100%',
                    fontFamily: 'inherit',
                  }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: c.custom ? colors.sand.bg : colors.green.soft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`ti ${COND_ICONS[k] || 'ti-heart-rate-monitor'}`}
                      style={{ fontSize: 18, color: c.custom ? colors.sand.text : colors.green.primary }} aria-hidden="true" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.text.title, marginBottom: 3 }}>
                      {c.label}
                    </div>
                    {!c.custom && (
                      <>
                        <div style={{ fontSize: 11, color: colors.text.soft, marginBottom: 5 }}>
                          <i className="ti ti-map-pin" style={{ fontSize: 12 }} aria-hidden="true" /> {c.zones.map((z) => zoneLabels[z] || z).join(', ')}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {c.triggers.filter((t) => !hiddenTriggers.includes(t)).slice(0, 4).map((t) => (
                            <span key={t} style={{
                              fontSize: 10, padding: '2px 7px', borderRadius: radius.sm,
                              background: colors.amber.bg, color: colors.amber.text,
                            }}>{t}</span>
                          ))}
                          {c.extra.options.slice(0, 2).map((o) => (
                            <span key={o} style={{
                              fontSize: 10, padding: '2px 7px', borderRadius: radius.sm,
                              background: colors.green.soft, color: colors.green.primaryDark,
                            }}>{o}</span>
                          ))}
                        </div>
                      </>
                    )}
                    {c.custom && (
                      <div style={{ fontSize: 11, color: colors.text.soft }}>
                        Decris ta propre pathologie
                      </div>
                    )}
                  </div>
                  <i className="ti ti-chevron-right" style={{ color: colors.text.faint, fontSize: 16, marginTop: 10 }} aria-hidden="true" />
                </button>
              )
            })}
            {filteredKeys.length === 0 && (
              <div style={{ textAlign: 'center', padding: 16, fontSize: 13, color: colors.text.faint }}>
                Aucune pathologie ne correspond a ta recherche.
              </div>
            )}
          </div>
        </div>
      ) : (
        <button onClick={() => setCondKey(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginBottom: 18,
            background: colors.green.primary, border: 'none', borderRadius: radius.md,
            padding: '10px 14px', cursor: 'pointer', fontFamily: 'inherit',
          }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className={`ti ${COND_ICONS[condKey] || 'ti-heart-rate-monitor'}`}
              style={{ fontSize: 16, color: '#fff' }} aria-hidden="true" />
          </div>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#fff', textAlign: 'left' }}>
            {cond.custom && customLabel ? customLabel : cond.label}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Changer</span>
          <i className="ti ti-chevron-down" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }} aria-hidden="true" />
        </button>
      )}

      {cond && (
        <>
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
            <div className="anim-fadeInUp" style={{ background: colors.sand.bg, borderRadius: radius.md, padding: '12px 14px', marginBottom: 18 }}>
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
                        fontFamily: 'inherit',
                      }}>
                      {lvl}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {!showEfficacy && <div style={{ height: 18 }} />}

          {/* Details supplementaires / extra */}
          {(cond.extra.options.length > 0 || cond.custom) && (
            <>
              <button onClick={() => setShowDetails((v) => !v)}
                style={{
                  width: '100%', background: colors.sand.bg, borderRadius: radius.md, padding: '13px 14px',
                  marginBottom: showDetails ? 12 : 18, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontFamily: 'inherit',
                }}>
                <span style={{ fontSize: 13, color: colors.sand.text, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <i className={`ti ${showDetails ? 'ti-minus' : 'ti-plus'}`} aria-hidden="true" /> {cond.extra.label || 'Plus de details'}
                </span>
                <i className={`ti ${showDetails ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ color: colors.sand.faint, transition: 'transform .25s ease', transform: showDetails ? 'rotate(180deg)' : 'rotate(0)' }} aria-hidden="true" />
              </button>

              {showDetails && (
                <div className="anim-slideDown" style={{ marginBottom: 18 }}>
                  {cond.extra.options.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: cond.custom ? 12 : 0 }}>
                      {cond.extra.options.map((o) => (
                        <Chip key={o} variant="green" active={extra.includes(o)} onClick={() => toggle(o, extra, setExtra)}>{o}</Chip>
                      ))}
                    </div>
                  )}
                  {cond.custom && (
                    <div>
                      <div style={{ fontSize: 12, color: colors.text.muted, marginBottom: 6 }}>Precision libre</div>
                      <input type="text" value={customExtra} onChange={(e) => setCustomExtra(e.target.value)}
                        placeholder="Decris tes symptomes..."
                        style={{
                          width: '100%', padding: '10px 13px', fontSize: 13, fontFamily: 'inherit',
                          border: `1.5px solid ${colors.border.soft}`, borderRadius: radius.sm,
                          background: colors.green.surface, color: colors.text.body, boxSizing: 'border-box',
                        }} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div style={{ flex: 1 }} />

          <PrimaryButton icon={saving ? 'ti-loader-2' : 'ti-check'} onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </PrimaryButton>
          <p style={{ textAlign: 'center', fontSize: 12, color: colors.text.faint, marginTop: 11, marginBottom: 0 }}>
            {"Saisie rapide \u00b7 l'efficacite se note plus tard"}
          </p>
        </>
      )}
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
