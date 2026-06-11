import { useState } from 'react'
import { colors, radius, font } from '../theme/tokens'
import { PrimaryButton, Segmented, AnimatedNumber } from '../components/ui'

import { useStore } from '../data/store'
import { computeStats, withoutBienetre, filterByPeriod, periodLabel, getRefDate, buildCalendarGrid, formatHour } from '../data/stats'
import { conditions, zoneLabels } from '../data/conditions'

export default function MedicalReport({ bp = 'mobile' }) {
  const { episodes: allEpisodes, profile } = useStore()
  const allReal = withoutBienetre(allEpisodes)
  const [period, setPeriod] = useState('m')
  const [offset, setOffset] = useState(0)

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
            <CalendarGrid episodes={allReal} year={ref.getFullYear()} month={ref.getMonth()} />
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
            <EpisodeDetailList episodes={filtered} />

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

function CalendarGrid({ episodes, year, month }) {
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
          {weeks.flat().map((cell, i) => (
            <div key={i} style={{
              minHeight: 36, padding: '3px 2px', textAlign: 'center',
              borderBottom: `1px solid ${colors.clinical.bg}`,
              borderRight: (i + 1) % 7 !== 0 ? `1px solid ${colors.clinical.bg}` : 'none',
              background: cell.isToday ? colors.clinical.surfaceSoft : 'transparent',
            }}>
              {cell.inMonth && (
                <>
                  <div style={{ fontSize: 10, color: cell.isToday ? colors.clinical.ink : colors.text.muted, fontWeight: cell.isToday ? 700 : 400 }}>
                    {cell.day}
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
          ))}
        </div>
      </div>
    </div>
  )
}

function EpisodeDetailList({ episodes }) {
  const sorted = [...episodes].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
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
            </tr>
          </thead>
          <tbody>
            {sorted.map((ep) => {
              const d = new Date(ep.createdAt)
              const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
              const zonesStr = (ep.zones || []).map((z) => zoneLabels[z] || z).join(', ') || '—'
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
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
