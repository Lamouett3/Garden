import { useState } from 'react'
import { colors, radius, font } from '../theme/tokens'
import { PrimaryButton, Segmented, AnimatedNumber } from '../components/ui'

import { useStore } from '../data/store'
import { computeStats, withoutBienetre, filterByPeriod, periodLabel, getRefDate, buildCalendarGrid, formatHour } from '../data/stats'
import { conditions, zoneLabels } from '../data/conditions'
import { getMoonPhase, getMoonPhaseName, getPlanetPositions } from '../data/astro'

export default function MedicalReport({ bp = 'mobile' }) {
  const { episodes: allEpisodes, profile } = useStore()
  const allReal = withoutBienetre(allEpisodes)
  const [period, setPeriod] = useState('m')
  const [offset, setOffset] = useState(0)
  const showAstro = profile.moonOn || profile.planetsOn
  const [astroIncluded, setAstroIncluded] = useState(false)

  const filtered = filterByPeriod(allReal, period, offset)
  const stats = computeStats(filtered)

  const cardW = bp === 'desktop' ? 620 : bp === 'tablet' ? 520 : 380
  const maxTrig = Math.max(1, ...stats.topTriggers.map((t) => t.count))
  const pLabel = periodLabel(period, offset)

  function handlePeriodChange(p) {
    setPeriod(p)
    setOffset(0)
  }

  const handleExport = () => window.print()

  if (allReal.length === 0) {
    return (
      <div style={{ background: colors.clinical.bg, borderRadius: radius.lg, padding: 24, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: cardW, background: colors.clinical.surface, borderRadius: radius.md, padding: 30, fontFamily: font.family, border: `0.5px solid ${colors.clinical.border}`, textAlign: 'center' }}>
          <i className="ti ti-file-text" style={{ fontSize: 36, color: colors.sand.faint }} aria-hidden="true" />
          <p style={{ fontSize: 14, color: colors.text.muted, marginTop: 14, lineHeight: 1.6 }}>
            Le rapport se genere automatiquement a partir de tes episodes. Note quelques episodes pour le remplir.
          </p>
        </div>
      </div>
    )
  }

  const now = new Date()
  const ref = getRefDate(period, offset)
  const intensityDist = computeIntensityDistribution(filtered)
  const conditionBreakdown = computeConditionBreakdown(filtered)
  const zoneBreakdown = computeZoneBreakdown(filtered)
  const timeBreakdown = computeTimeBreakdown(filtered)
  const avgPerDay = computeAvgPerDay(filtered, period)
  const maxIntDay = computeMaxIntensityDay(filtered)

  return (
    <div style={{ background: colors.clinical.bg, borderRadius: radius.lg, padding: 24, display: 'flex', justifyContent: 'center' }} className="report-wrap">
      <div className="report-card" style={{
        width: '100%', maxWidth: cardW, background: colors.clinical.surface, borderRadius: radius.md,
        padding: '28px 24px', fontFamily: font.family, border: `0.5px solid ${colors.clinical.border}`,
      }}>
        {/* En-tete */}
        <div style={{ borderBottom: `1.5px solid ${colors.clinical.bg}`, paddingBottom: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: colors.clinical.ink }}>Rapport de suivi</div>
              <div style={{ fontSize: 12, color: colors.text.soft, marginTop: 3 }}>{pLabel}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: colors.text.soft }}>Genere le {formatDate(now)}</div>
              <div style={{ fontSize: 11, color: colors.sand.faint, marginTop: 2 }}>
                {filtered.length} episode{filtered.length > 1 ? 's' : ''} · {distinctConditions(filtered)} pathologie{distinctConditions(filtered) > 1 ? 's' : ''}
              </div>
            </div>
          </div>
          {profile.gender && (
            <div style={{ fontSize: 11, color: colors.text.muted, marginTop: 8 }}>
              Profil : {profile.gender === 'f' ? 'Femme' : profile.gender === 'h' ? 'Homme' : 'Non precise'}
              {profile.cycleOn && profile.gender !== 'h' && ' · Suivi du cycle actif'}
            </div>
          )}
        </div>

        <div className="no-print">
          <Segmented variant="clinical"
            options={[{ value: 'j', label: 'Jour' }, { value: 's', label: 'Semaine' }, { value: 'm', label: 'Mois' }, { value: 'a', label: 'Annee' }]}
            value={period} onChange={handlePeriodChange} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            <NavBtn icon="ti-chevron-left" onClick={() => setOffset((o) => o - 1)} label="Periode precedente" />
            <button onClick={() => setOffset(0)}
              style={{
                border: 'none', background: offset === 0 ? colors.clinical.surfaceSoft : colors.clinical.bg,
                borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 600,
                color: colors.clinical.ink, cursor: 'pointer', fontFamily: 'inherit',
                minWidth: 140, textAlign: 'center',
              }}>
              {offset === 0 ? pLabel : pLabel}
            </button>
            <NavBtn icon="ti-chevron-right" onClick={() => setOffset((o) => Math.min(o + 1, 0))} label="Periode suivante" disabled={offset >= 0} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 10px', marginBottom: 18 }}>
            <i className="ti ti-calendar-off" style={{ fontSize: 28, color: colors.sand.faint }} aria-hidden="true" />
            <p style={{ fontSize: 13, color: colors.text.muted, marginTop: 8 }}>Aucun episode sur cette periode.</p>
          </div>
        ) : (
          <>
            {/* --- Synthese --- */}
            <SectionTitle icon="ti-report-medical">Synthese</SectionTitle>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <KeyStat value={String(stats.count)} label="episodes" />
              <KeyStat value={stats.avgIntensity} suffix="/10" label="intensite moy." />
              <KeyStat value={avgPerDay} label="ep./jour moy." />
              <KeyStat value={maxIntDay.value} suffix="/10" label={`pic le ${maxIntDay.date}`} />
            </div>

            {/* --- Repartition par pathologie --- */}
            {conditionBreakdown.length > 1 && (
              <>
                <SectionTitle icon="ti-stethoscope">Repartition par pathologie</SectionTitle>
                <div style={{ marginBottom: 18 }}>
                  {conditionBreakdown.map((c, i) => (
                    <div key={c.key} className={`anim-fadeInUp anim-d${Math.min(i + 1, 8)}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i === conditionBreakdown.length - 1 ? 0 : 6 }}>
                      <span style={{ fontSize: 12, color: colors.text.muted, width: 90, flexShrink: 0 }}>{c.label}</span>
                      <span style={{ flex: 1, height: 8, background: colors.clinical.bg, borderRadius: 5, overflow: 'hidden' }}>
                        <span className="anim-barFillX" style={{ display: 'block', width: `${c.pct}%`, height: '100%', background: colors.green.primary, borderRadius: 5 }} />
                      </span>
                      <span style={{ fontSize: 11, color: colors.text.soft, width: 50, textAlign: 'right' }}>{c.count} ({c.pct}%)</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* --- Distribution d'intensite --- */}
            <SectionTitle icon="ti-chart-bar">Distribution d'intensite</SectionTitle>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 50, marginBottom: 6 }}>
              {intensityDist.map((d, i) => (
                <div key={d.level} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="anim-barGrow" style={{
                    width: '100%', maxWidth: 28, borderRadius: 3,
                    height: d.pct > 0 ? Math.max(4, d.pct * 0.45) : 0,
                    background: d.level <= 3 ? colors.green.leaf : d.level <= 6 ? colors.amber.bar : d.level <= 8 ? colors.coral.barStrong : '#C45050',
                    animationDelay: `${i * 0.04}s`,
                  }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 3, marginBottom: 18 }}>
              {intensityDist.map((d) => (
                <div key={d.level} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: colors.text.faint }}>{d.level}</div>
              ))}
            </div>

            {/* --- Zones corporelles --- */}
            {zoneBreakdown.length > 0 && (
              <>
                <SectionTitle icon="ti-man">Zones corporelles touchees</SectionTitle>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                  {zoneBreakdown.map((z, i) => (
                    <span key={z.zone} className={`anim-popIn anim-d${Math.min(i + 1, 8)}`} style={{
                      fontSize: 11, padding: '5px 10px', borderRadius: 8,
                      background: colors.clinical.surfaceSoft, color: colors.text.body,
                      border: `1px solid ${colors.clinical.bg}`,
                    }}>
                      {z.label} <strong style={{ color: colors.clinical.ink }}>{z.count}</strong>
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* --- Calendrier + legende --- */}
            <CalendarGrid episodes={allReal} year={ref.getFullYear()} month={ref.getMonth()} showMoon={profile.moonOn} />
            <CalendarLegend />

            {/* --- Repartition horaire --- */}
            <SectionTitle icon="ti-clock">Repartition horaire</SectionTitle>
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 36, marginBottom: 4 }}>
              {timeBreakdown.map((t, i) => (
                <div key={t.slot} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="anim-barGrow" style={{
                    width: '100%', maxWidth: 20, borderRadius: 2,
                    height: t.count > 0 ? Math.max(3, (t.count / Math.max(1, ...timeBreakdown.map(s => s.count))) * 32) : 0,
                    background: colors.green.primary, opacity: 0.7,
                    animationDelay: `${i * 0.02}s`,
                  }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 2, marginBottom: 18 }}>
              {timeBreakdown.map((t, i) => (
                <div key={t.slot} style={{ flex: 1, textAlign: 'center', fontSize: 8, color: colors.text.faint }}>
                  {i % 3 === 0 ? t.slot : ''}
                </div>
              ))}
            </div>

            {/* --- Detail des episodes --- */}
            <EpisodeDetailList episodes={filtered} showMoon={profile.moonOn} showPlanets={profile.planetsOn} />

            {/* --- Declencheurs --- */}
            {stats.topTriggers.length > 0 && (
              <>
                <SectionTitle icon="ti-bolt">Declencheurs les plus frequents</SectionTitle>
                <div style={{ marginBottom: 18 }}>
                  {stats.topTriggers.map((t, i) => (
                    <TriggerBar key={t.label} label={t.label} pct={Math.round((t.count / maxTrig) * 100)} count={t.count} total={filtered.length} last={i === stats.topTriggers.length - 1} />
                  ))}
                </div>
              </>
            )}

            {/* --- Traitements --- */}
            {stats.treatments.length > 0 && (
              <>
                <SectionTitle icon="ti-pill">Traitements &amp; efficacite</SectionTitle>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginBottom: 20 }}>
                  <thead>
                    <tr style={{ color: colors.sand.faint, fontSize: 10 }}>
                      <th style={{ textAlign: 'left', paddingBottom: 6, fontWeight: 600 }}>Traitement</th>
                      <th style={{ textAlign: 'center', paddingBottom: 6, fontWeight: 600 }}>Prises</th>
                      <th style={{ textAlign: 'center', paddingBottom: 6, fontWeight: 600 }}>A soulage</th>
                      <th style={{ textAlign: 'right', paddingBottom: 6, fontWeight: 600 }}>Taux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.treatments.map((t) => {
                      const rate = t.taken > 0 ? Math.round((t.relieved / t.taken) * 100) : 0
                      return (
                        <tr key={t.name} style={{ borderTop: `1px solid ${colors.clinical.bg}` }}>
                          <td style={{ padding: '7px 0', color: colors.text.body }}>{t.name}</td>
                          <td style={{ textAlign: 'center', color: colors.text.muted }}>{t.taken}</td>
                          <td style={{ textAlign: 'center', color: t.relieved >= t.taken / 2 ? colors.green.primaryDark : colors.amber.text, fontWeight: 600 }}>
                            {t.relieved} / {t.taken}
                          </td>
                          <td style={{ textAlign: 'right', fontSize: 11 }}>
                            <span style={{
                              padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                              background: rate >= 60 ? '#E7EFE8' : rate >= 30 ? colors.amber.bg : '#FDF0F3',
                              color: rate >= 60 ? colors.green.primaryDark : rate >= 30 ? colors.amber.text : '#9A3D5E',
                            }}>{rate}%</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </>
            )}

            {/* --- Note de contexte --- */}
            <div style={{
              background: colors.clinical.surfaceSoft, borderRadius: radius.sm,
              padding: '12px 14px', marginBottom: 18, borderLeft: `3px solid ${colors.clinical.bg}`,
            }}>
              <div style={{ fontSize: 11, color: colors.text.muted, lineHeight: 1.6 }}>
                <strong style={{ color: colors.clinical.ink }}>Note :</strong> Ce rapport est genere automatiquement a partir des donnees saisies par le patient via l'application Pousse. Les donnees sont auto-declaratives et ne constituent pas un diagnostic medical. Elles sont destinees a faciliter le dialogue entre le patient et son professionnel de sante.
              </div>
            </div>

            {/* --- Section astronomique (optionnelle) --- */}
            {showAstro && (
              <>
                <div style={{
                  borderTop: `1.5px dashed ${colors.clinical.bg}`, paddingTop: 16, marginBottom: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <i className="ti ti-moon-stars" style={{ fontSize: 17, color: colors.text.soft }} aria-hidden="true" />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: colors.clinical.ink }}>Reperes astronomiques</div>
                      <div style={{ fontSize: 10, color: colors.text.soft }}>Correlations avec tes cycles lunaires et planetaires</div>
                    </div>
                  </div>
                  <button className="no-print" onClick={() => setAstroIncluded((v) => !v)}
                    style={{
                      border: `1.5px solid ${astroIncluded ? colors.green.primary : colors.border.soft}`,
                      background: astroIncluded ? colors.green.soft : 'transparent',
                      borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 600,
                      color: astroIncluded ? colors.green.primaryDark : colors.text.muted,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                    <i className={`ti ${astroIncluded ? 'ti-check' : 'ti-plus'}`} style={{ fontSize: 13 }} aria-hidden="true" />
                    {astroIncluded ? 'Inclus au PDF' : 'Inclure au PDF'}
                  </button>
                </div>
                <div className={astroIncluded ? '' : 'no-print'}>
                  <AstroSection episodes={filtered} showMoon={profile.moonOn} showPlanets={profile.planetsOn} />
                </div>
              </>
            )}
          </>
        )}

        <div className="no-print">
          <PrimaryButton icon="ti-download" dark onClick={handleExport}>Exporter en PDF</PrimaryButton>
          <p style={{ textAlign: 'center', fontSize: 11, color: colors.sand.faint, marginTop: 10, marginBottom: 0 }}>
            Donnees personnelles {'\u00b7'} partagees uniquement a ton initiative
          </p>
        </div>
      </div>
    </div>
  )
}

// --- Helpers de calcul ---

function distinctConditions(episodes) {
  return new Set(episodes.map((e) => e.condition)).size
}

function formatDate(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function computeIntensityDistribution(episodes) {
  const dist = Array.from({ length: 11 }, (_, i) => ({ level: i, count: 0, pct: 0 }))
  episodes.forEach((e) => { dist[e.intensity || 0].count++ })
  const total = episodes.length || 1
  dist.forEach((d) => { d.pct = Math.round((d.count / total) * 100) })
  return dist
}

function computeConditionBreakdown(episodes) {
  const counts = {}
  episodes.forEach((e) => { counts[e.condition] = (counts[e.condition] || 0) + 1 })
  const total = episodes.length || 1
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      key, count,
      label: conditions[key]?.label || key,
      pct: Math.round((count / total) * 100),
    }))
}

function computeZoneBreakdown(episodes) {
  const counts = {}
  episodes.forEach((e) => (e.zones || []).forEach((z) => { counts[z] = (counts[z] || 0) + 1 }))
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([zone, count]) => ({ zone, count, label: zoneLabels[zone] || zone }))
}

function computeTimeBreakdown(episodes) {
  const slots = Array.from({ length: 24 }, (_, i) => ({ slot: `${i}h`, count: 0 }))
  episodes.forEach((e) => {
    const h = new Date(e.createdAt).getHours()
    slots[h].count++
  })
  return slots
}

function computeAvgPerDay(episodes, period) {
  if (episodes.length === 0) return '0'
  const days = new Set(episodes.map((e) => {
    const d = new Date(e.createdAt)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }))
  const avg = episodes.length / Math.max(1, days.size)
  return (Math.round(avg * 10) / 10).toString().replace('.', ',')
}

function computeMaxIntensityDay(episodes) {
  if (episodes.length === 0) return { value: '—', date: '—' }
  let maxI = 0, maxDate = ''
  episodes.forEach((e) => {
    if ((e.intensity || 0) >= maxI) {
      maxI = e.intensity || 0
      const d = new Date(e.createdAt)
      maxDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    }
  })
  return { value: String(maxI), date: maxDate }
}

// --- Composants UI ---

function NavBtn({ icon, onClick, label, disabled }) {
  return (
    <button onClick={onClick} aria-label={label} disabled={disabled}
      style={{
        border: 'none', background: colors.clinical.bg, borderRadius: 8,
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.3 : 1,
        color: colors.clinical.ink, fontSize: 16,
      }}>
      <i className={`ti ${icon}`} aria-hidden="true" />
    </button>
  )
}

function SectionTitle({ children, icon }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: colors.clinical.ink, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 15, color: colors.text.soft }} aria-hidden="true" />}
      {children}
    </div>
  )
}

function KeyStat({ value, suffix, label }) {
  return (
    <div className="anim-fadeInUp" style={{ flex: 1, minWidth: 70, background: colors.clinical.surfaceSoft, borderRadius: radius.sm, padding: '11px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: colors.clinical.ink }}>
        <AnimatedNumber value={value} />{suffix && value !== '\u2014' && <span style={{ fontSize: 11, color: colors.sand.faint }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: 9, color: colors.text.soft, lineHeight: 1.3 }}>{label}</div>
    </div>
  )
}

function TriggerBar({ label, pct, count, total, last }) {
  const pctOfTotal = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="anim-fadeInUp" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: last ? 0 : 8 }}>
      <span style={{ fontSize: 12, color: colors.text.muted, width: 90, flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1, height: 8, background: colors.clinical.bg, borderRadius: 5, overflow: 'hidden' }}>
        <span className="anim-barFillX" style={{ display: 'block', width: `${pct}%`, height: '100%', background: colors.green.primary, borderRadius: 5 }} />
      </span>
      <span style={{ fontSize: 11, color: colors.text.soft, width: 60, textAlign: 'right' }}>{count} ({pctOfTotal}%)</span>
    </div>
  )
}

const DOT_COLOR = (v) => v <= 3 ? colors.green.leaf : v <= 6 ? colors.amber.bar : v <= 8 ? colors.coral.barStrong : '#C45050'

function CalendarLegend() {
  const items = [
    { color: colors.green.leaf, label: 'Faible (1-3)' },
    { color: colors.amber.bar, label: 'Modere (4-6)' },
    { color: colors.coral.barStrong, label: 'Fort (7-8)' },
    { color: '#C45050', label: 'Severe (9-10)' },
  ]
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18, paddingLeft: 2 }}>
      {items.map((it) => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: it.color, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: colors.text.soft }}>{it.label}</span>
        </div>
      ))}
    </div>
  )
}

const MOON_ICON_TINY = (phase) => {
  if (phase < 0.0625) return { icon: 'ti-circle', opacity: 0.3 }
  if (phase < 0.1875) return { icon: 'ti-moon', opacity: 0.35 }
  if (phase < 0.3125) return { icon: 'ti-circle-half-vertical', opacity: 0.4 }
  if (phase < 0.4375) return { icon: 'ti-moon-filled', opacity: 0.45 }
  if (phase < 0.5625) return { icon: 'ti-circle-filled', opacity: 0.55 }
  if (phase < 0.6875) return { icon: 'ti-moon-filled', opacity: 0.45 }
  if (phase < 0.8125) return { icon: 'ti-circle-half-vertical', opacity: 0.4 }
  if (phase < 0.9375) return { icon: 'ti-moon', opacity: 0.35 }
  return { icon: 'ti-circle', opacity: 0.3 }
}

function CalendarGrid({ episodes, year, month, showMoon }) {
  const { weeks, monthLabel } = buildCalendarGrid(episodes, year, month)
  const dayHeaders = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  return (
    <div style={{ marginBottom: 8 }}>
      <SectionTitle icon="ti-calendar">Calendrier — {monthLabel}</SectionTitle>
      <div style={{ border: `1px solid ${colors.clinical.bg}`, borderRadius: radius.sm, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {dayHeaders.map((d, i) => (
            <div key={i} style={{
              textAlign: 'center', fontSize: 10, fontWeight: 600,
              color: colors.text.soft, padding: '6px 0',
              background: colors.clinical.surfaceSoft,
              borderBottom: `1px solid ${colors.clinical.bg}`,
            }}>{d}</div>
          ))}
          {weeks.flat().map((cell, i) => {
            const moonIcon = (showMoon && cell.inMonth)
              ? MOON_ICON_TINY(getMoonPhase(new Date(year, month, cell.day)))
              : null
            return (
              <div key={i} style={{
                minHeight: showMoon ? 42 : 36, padding: '3px 2px', textAlign: 'center',
                borderBottom: `1px solid ${colors.clinical.bg}`,
                borderRight: (i + 1) % 7 !== 0 ? `1px solid ${colors.clinical.bg}` : 'none',
                background: cell.isToday ? colors.clinical.surfaceSoft : 'transparent',
              }}>
                {cell.inMonth && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <span style={{ fontSize: 10, color: cell.isToday ? colors.clinical.ink : colors.text.muted, fontWeight: cell.isToday ? 700 : 400 }}>
                        {cell.day}
                      </span>
                      {moonIcon && (
                        <i className={`ti ${moonIcon.icon}`}
                          style={{ fontSize: 8, color: '#9A8F80', opacity: moonIcon.opacity }}
                          aria-hidden="true" />
                      )}
                    </div>
                    {cell.episodes.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2, flexWrap: 'wrap' }}>
                        {cell.episodes.map((ep, j) => (
                          <span key={j}
                            title={`${ep.hour} — ${conditions[ep.condition]?.label || ep.condition} (${ep.intensity}/10)`}
                            style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: DOT_COLOR(ep.intensity || 0),
                            }} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const ZODIAC_FULL = [
  'Belier', 'Taureau', 'Gemeaux', 'Cancer', 'Lion', 'Vierge',
  'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons',
]
const ZODIAC_SHORT = ['Bel', 'Tau', 'Gem', 'Can', 'Lio', 'Vie', 'Bal', 'Sco', 'Sag', 'Cap', 'Ver', 'Poi']
function zodiacShort(angle) {
  return ZODIAC_SHORT[Math.floor(((angle % 360) + 360) % 360 / 30)]
}

const REPORT_PLANET_LABELS = { mercure: 'Me', venus: 'Ve', mars: 'Ma', jupiter: 'Ju', saturne: 'Sa' }

function EpisodeDetailList({ episodes, showMoon, showPlanets }) {
  const sorted = [...episodes].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const hasAstro = showMoon || showPlanets
  return (
    <div style={{ marginBottom: 18 }}>
      <SectionTitle icon="ti-list">Detail des episodes</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: colors.sand.faint, fontSize: 10 }}>
              <th style={{ textAlign: 'left', paddingBottom: 6, fontWeight: 600 }}>Date</th>
              <th style={{ textAlign: 'left', paddingBottom: 6, fontWeight: 600 }}>Heure</th>
              <th style={{ textAlign: 'left', paddingBottom: 6, fontWeight: 600 }}>Pathologie</th>
              <th style={{ textAlign: 'left', paddingBottom: 6, fontWeight: 600 }}>Zones</th>
              <th style={{ textAlign: 'center', paddingBottom: 6, fontWeight: 600 }}>Intensite</th>
              <th style={{ textAlign: 'right', paddingBottom: 6, fontWeight: 600 }}>Duree</th>
              <th style={{ textAlign: 'right', paddingBottom: 6, fontWeight: 600 }}>Traitement</th>
              {hasAstro && <th style={{ textAlign: 'right', paddingBottom: 6, fontWeight: 600 }}>Reperes astro.</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((ep) => {
              const d = new Date(ep.createdAt)
              const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
              const zonesStr = (ep.zones || []).map((z) => zoneLabels[z] || z).join(', ') || '—'

              let astroCell = null
              if (hasAstro) {
                const parts = []
                if (showMoon) {
                  const moonInfo = getMoonPhaseName(d)
                  parts.push(moonInfo.label.split(' ').slice(-1)[0])
                }
                if (showPlanets) {
                  const planets = getPlanetPositions(d).filter((p) => p.id !== 'terre')
                  const pStr = planets.map((p) => `${REPORT_PLANET_LABELS[p.id]}${zodiacShort(p.angle)}`).join(' ')
                  parts.push(pStr)
                }
                astroCell = parts.join(' · ')
              }

              return (
                <tr key={ep.id} style={{ borderTop: `1px solid ${colors.clinical.bg}` }}>
                  <td style={{ padding: '6px 0', color: colors.text.body }}>{dateStr}</td>
                  <td style={{ color: colors.text.muted }}>{formatHour(ep.createdAt)}</td>
                  <td style={{ color: colors.text.body }}>{conditions[ep.condition]?.label || ep.condition}</td>
                  <td style={{ color: colors.text.soft, fontSize: 10 }}>{zonesStr}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                      background: (ep.intensity || 0) <= 3 ? '#E7EFE8' : (ep.intensity || 0) <= 6 ? colors.amber.bg : '#FDF0F3',
                      color: (ep.intensity || 0) <= 3 ? colors.green.primaryDark : (ep.intensity || 0) <= 6 ? colors.amber.text : '#9A3D5E',
                    }}>{ep.intensity || 0}/10</span>
                  </td>
                  <td style={{ textAlign: 'right', color: colors.text.soft }}>{ep.duration || '—'}</td>
                  <td style={{ textAlign: 'right', color: colors.text.muted, fontSize: 10 }}>{ep.treatment && ep.treatment !== 'Aucun' ? ep.treatment : '—'}</td>
                  {hasAstro && (
                    <td style={{ textAlign: 'right', fontSize: 9, color: '#9A8F80', maxWidth: 90 }}>{astroCell}</td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// --- Corrélations astronomiques ---

const MOON_PHASES = [
  { key: 'nouvelle', label: 'Nouvelle lune', min: 0, max: 0.125, icon: 'ti-circle', color: '#5A6B5E' },
  { key: 'croissant1', label: 'Premier croissant', min: 0.125, max: 0.25, icon: 'ti-moon', color: '#9FC4A4' },
  { key: 'quartier1', label: 'Premier quartier', min: 0.25, max: 0.375, icon: 'ti-circle-half-vertical', color: '#B8AFA0' },
  { key: 'gibbeuse_c', label: 'Gibbeuse croissante', min: 0.375, max: 0.5, icon: 'ti-moon-filled', color: '#C4B17C' },
  { key: 'pleine', label: 'Pleine lune', min: 0.5, max: 0.625, icon: 'ti-circle-filled', color: '#FFFDE7' },
  { key: 'gibbeuse_d', label: 'Gibbeuse decroissante', min: 0.625, max: 0.75, icon: 'ti-moon-filled', color: '#C4B17C' },
  { key: 'quartier3', label: 'Dernier quartier', min: 0.75, max: 0.875, icon: 'ti-circle-half-vertical', color: '#B8AFA0' },
  { key: 'croissant3', label: 'Dernier croissant', min: 0.875, max: 1.0, icon: 'ti-moon', color: '#9FC4A4' },
]

function getMoonPhaseIndex(phase) {
  for (let i = 0; i < MOON_PHASES.length; i++) {
    if (phase < MOON_PHASES[i].max) return i
  }
  return 0
}

function computeMoonCorrelation(episodes) {
  const buckets = MOON_PHASES.map((p) => ({ ...p, count: 0, totalIntensity: 0, episodes: [] }))

  episodes.forEach((ep) => {
    const d = new Date(ep.createdAt)
    const phase = getMoonPhase(d)
    const idx = getMoonPhaseIndex(phase)
    buckets[idx].count++
    buckets[idx].totalIntensity += (ep.intensity || 0)
    buckets[idx].episodes.push(ep)
  })

  const total = episodes.length || 1
  buckets.forEach((b) => {
    b.pct = Math.round((b.count / total) * 100)
    b.avgIntensity = b.count > 0 ? Math.round((b.totalIntensity / b.count) * 10) / 10 : 0
  })

  // Insights
  const insights = []
  const maxBucket = buckets.reduce((a, b) => b.count > a.count ? b : a, buckets[0])
  const minBucket = buckets.filter((b) => b.count > 0).reduce((a, b) => b.count < a.count ? b : a, maxBucket)
  const maxIntBucket = buckets.filter((b) => b.count >= 2).reduce((a, b) => b.avgIntensity > a.avgIntensity ? b : a, buckets[0])

  if (maxBucket.count > 0 && maxBucket.pct >= 20) {
    insights.push(`${maxBucket.pct}% de tes episodes surviennent en phase de ${maxBucket.label.toLowerCase()} (${maxBucket.count}/${total}).`)
  }
  if (maxIntBucket.count >= 2 && maxIntBucket.avgIntensity > 0) {
    insights.push(`L'intensite moyenne est la plus elevee en ${maxIntBucket.label.toLowerCase()} : ${String(maxIntBucket.avgIntensity).replace('.', ',')}/10.`)
  }
  if (maxBucket.key !== minBucket.key && minBucket.count > 0 && maxBucket.count >= minBucket.count * 2) {
    insights.push(`Les episodes sont ${Math.round(maxBucket.count / Math.max(1, minBucket.count))}x plus frequents en ${maxBucket.label.toLowerCase()} qu'en ${minBucket.label.toLowerCase()}.`)
  }

  return { buckets, insights }
}

const PLANET_LABELS = {
  mercure: 'Mercure', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturne: 'Saturne',
}

// Signe zodiacal simplifie (30 degres chacun, ecliptique)
const ZODIAC = [
  'Belier', 'Taureau', 'Gemeaux', 'Cancer', 'Lion', 'Vierge',
  'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons',
]
function zodiacSign(angle) {
  return ZODIAC[Math.floor(((angle % 360) + 360) % 360 / 30)]
}

function computePlanetaryCorrelation(episodes) {
  if (episodes.length === 0) return { planetPhases: [], insights: [] }

  // For each episode, compute planet positions
  const epData = episodes.map((ep) => {
    const d = new Date(ep.createdAt)
    const planets = getPlanetPositions(d)
    return { ep, planets, intensity: ep.intensity || 0 }
  })

  // For each planet (excluding earth), find the zodiac sign distribution during episodes
  const planetIds = ['mercure', 'venus', 'mars', 'jupiter', 'saturne']
  const planetPhases = planetIds.map((pid) => {
    const signCounts = {}
    const signIntensity = {}
    epData.forEach(({ planets, intensity }) => {
      const p = planets.find((pp) => pp.id === pid)
      if (!p) return
      const sign = zodiacSign(p.angle)
      signCounts[sign] = (signCounts[sign] || 0) + 1
      signIntensity[sign] = (signIntensity[sign] || 0) + intensity
    })
    const signs = Object.entries(signCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([sign, count]) => ({
        sign, count,
        pct: Math.round((count / episodes.length) * 100),
        avgIntensity: Math.round((signIntensity[sign] / count) * 10) / 10,
      }))
    return { id: pid, label: PLANET_LABELS[pid], signs }
  })

  // High intensity episodes (>= 7)
  const highEps = epData.filter((e) => e.intensity >= 7)
  const insights = []

  if (highEps.length >= 2) {
    // Find dominant sign for each planet during high-intensity episodes
    planetIds.forEach((pid) => {
      const signCounts = {}
      highEps.forEach(({ planets }) => {
        const p = planets.find((pp) => pp.id === pid)
        if (p) {
          const sign = zodiacSign(p.angle)
          signCounts[sign] = (signCounts[sign] || 0) + 1
        }
      })
      const top = Object.entries(signCounts).sort((a, b) => b[1] - a[1])[0]
      if (top && top[1] >= 2) {
        const pct = Math.round((top[1] / highEps.length) * 100)
        if (pct >= 40) {
          insights.push(`${pct}% de tes episodes intenses (>= 7/10) surviennent avec ${PLANET_LABELS[pid]} en ${top[0]}.`)
        }
      }
    })
  }

  // Current positions for context
  const currentPositions = getPlanetPositions(new Date())
    .filter((p) => p.id !== 'terre')
    .map((p) => ({ ...p, sign: zodiacSign(p.angle) }))

  return { planetPhases, insights, currentPositions }
}

function AstroSection({ episodes, showMoon, showPlanets }) {
  const moonData = showMoon ? computeMoonCorrelation(episodes) : null
  const planetData = showPlanets ? computePlanetaryCorrelation(episodes) : null
  const maxMoonCount = moonData ? Math.max(1, ...moonData.buckets.map((b) => b.count)) : 1
  const allInsights = [
    ...(moonData ? moonData.insights : []),
    ...(planetData ? planetData.insights : []),
  ]

  return (
    <div style={{ marginTop: 10 }}>
      {/* Avertissement */}
      <div style={{
        background: '#FFF8EE', borderRadius: radius.sm,
        padding: '10px 14px', marginBottom: 14,
        border: `1.5px solid ${colors.amber.border}`,
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <i className="ti ti-alert-triangle" style={{ color: colors.amber.text, fontSize: 16, marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
        <div style={{ fontSize: 11, color: colors.amber.text, lineHeight: 1.55 }}>
          <strong>Section informative — sans valeur medicale.</strong> Les correlations presentees ci-dessous sont des observations purement statistiques basees sur les reperes astronomiques choisis par l'utilisateur. Elles ne constituent en aucun cas une analyse medicale et ne doivent pas etre utilisees pour orienter un diagnostic ou un traitement.
        </div>
      </div>

      {/* Corrélations lunaires */}
      {moonData && (
        <>
          <SectionTitle icon="ti-moon">Repartition lunaire des episodes</SectionTitle>
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 56, marginBottom: 4 }}>
            {moonData.buckets.map((b, i) => (
              <div key={b.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="anim-barGrow" style={{
                  width: '100%', maxWidth: 32, borderRadius: 3,
                  height: b.count > 0 ? Math.max(5, (b.count / maxMoonCount) * 48) : 0,
                  background: b.key === 'pleine' ? '#C4B17C' : b.key === 'nouvelle' ? '#5A6B5E' : colors.green.leaf,
                  opacity: b.count > 0 ? 0.85 : 0.2,
                  animationDelay: `${i * 0.05}s`,
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
            {moonData.buckets.map((b) => (
              <div key={b.key} style={{ flex: 1, textAlign: 'center', fontSize: 8, color: colors.text.faint }}>
                {b.count > 0 ? b.count : ''}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
            {moonData.buckets.map((b) => (
              <div key={b.key} style={{ flex: 1, textAlign: 'center' }}>
                <i className={`ti ${b.icon}`} style={{ fontSize: 11, color: b.color }} aria-hidden="true" />
              </div>
            ))}
          </div>

          {/* Intensité moyenne par phase */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
            {moonData.buckets.filter((b) => b.count > 0).map((b) => (
              <div key={b.key} style={{
                fontSize: 10, padding: '4px 8px', borderRadius: 6,
                background: colors.clinical.surfaceSoft,
                border: `1px solid ${colors.clinical.bg}`,
                color: colors.text.body, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <i className={`ti ${b.icon}`} style={{ fontSize: 10, color: b.color }} aria-hidden="true" />
                <span style={{ color: colors.text.soft }}>{b.label.split(' ').slice(-1)[0]}</span>
                <strong style={{ color: colors.clinical.ink }}>{String(b.avgIntensity).replace('.', ',')}</strong>
                <span style={{ fontSize: 8, color: colors.text.faint }}>/10</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Corrélations planétaires */}
      {planetData && planetData.planetPhases.length > 0 && (
        <>
          <SectionTitle icon="ti-planet">Positions planetaires lors des episodes</SectionTitle>

          {/* Positions actuelles */}
          <div style={{
            display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12,
            background: colors.clinical.surfaceSoft, borderRadius: radius.sm, padding: '10px 12px',
          }}>
            <span style={{ fontSize: 10, color: colors.text.soft, width: '100%', marginBottom: 2 }}>Positions actuelles :</span>
            {planetData.currentPositions.map((p) => (
              <span key={p.id} style={{
                fontSize: 10, padding: '3px 7px', borderRadius: 5,
                background: colors.clinical.bg, color: colors.text.body,
              }}>
                {PLANET_LABELS[p.id]} en <strong>{p.sign}</strong>
              </span>
            ))}
          </div>

          {/* Signe dominant par planète */}
          <div style={{ marginBottom: 16 }}>
            {planetData.planetPhases.map((pp) => {
              const top = pp.signs[0]
              if (!top || top.pct < 15) return null
              return (
                <div key={pp.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 6, fontSize: 11,
                }}>
                  <span style={{ width: 70, color: colors.text.muted, flexShrink: 0, fontWeight: 500 }}>{pp.label}</span>
                  <span style={{ flex: 1, height: 7, background: colors.clinical.bg, borderRadius: 4, overflow: 'hidden' }}>
                    <span className="anim-barFillX" style={{
                      display: 'block', width: `${top.pct}%`, height: '100%',
                      background: colors.green.primary, borderRadius: 4, opacity: 0.7,
                    }} />
                  </span>
                  <span style={{ fontSize: 10, color: colors.text.soft, width: 90, textAlign: 'right' }}>
                    {top.sign} ({top.pct}%)
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Insights auto-générés */}
      {allInsights.length > 0 && (
        <div style={{
          background: colors.clinical.surfaceSoft, borderRadius: radius.sm,
          padding: '12px 14px', marginBottom: 14,
          borderLeft: `3px solid ${colors.green.leaf}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.clinical.ink, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-sparkles" style={{ fontSize: 14, color: colors.green.leaf }} aria-hidden="true" />
            Observations
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: colors.text.body, lineHeight: 1.7 }}>
            {allInsights.map((ins, i) => <li key={i}>{ins}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
