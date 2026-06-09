import { useState } from 'react'
import { colors, radius, font } from '../theme/tokens'
import { PrimaryButton, Segmented } from '../components/ui'

import { useStore } from '../data/store'
import { computeStats, withoutBienetre, filterByPeriod, periodLabel, buildCalendarGrid, formatHour } from '../data/stats'
import { conditions } from '../data/conditions'

export default function MedicalReport({ bp = 'mobile' }) {
  const { episodes: allEpisodes } = useStore()
  const allReal = withoutBienetre(allEpisodes)
  const [period, setPeriod] = useState('m')

  const filtered = filterByPeriod(allReal, period)
  const stats = computeStats(filtered)

  const cardW = bp === 'desktop' ? 560 : bp === 'tablet' ? 480 : 360
  const maxTrig = Math.max(1, ...stats.topTriggers.map((t) => t.count))
  const pLabel = periodLabel(period)

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

  return (
    <div style={{ background: colors.clinical.bg, borderRadius: radius.lg, padding: 24, display: 'flex', justifyContent: 'center' }} className="report-wrap">
      <div className="report-card" style={{
        width: '100%', maxWidth: cardW, background: colors.clinical.surface, borderRadius: radius.md,
        padding: '24px 22px', fontFamily: font.family, border: `0.5px solid ${colors.clinical.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: `1.5px solid ${colors.clinical.bg}`, paddingBottom: 14, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: colors.clinical.ink }}>Rapport de suivi</div>
            <div style={{ fontSize: 12, color: colors.text.soft, marginTop: 2 }}>{pLabel}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: colors.text.muted }}>Mon suivi</div>
            <div style={{ fontSize: 11, color: colors.sand.faint }}>{filtered.length} episode{filtered.length > 1 ? 's' : ''}</div>
          </div>
        </div>

        <div className="no-print">
          <Segmented variant="clinical"
            options={[{ value: 'j', label: 'Jour' }, { value: 's', label: 'Semaine' }, { value: 'm', label: 'Mois' }, { value: 'a', label: 'Annee' }]}
            value={period} onChange={setPeriod} />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 10px', marginBottom: 18 }}>
            <i className="ti ti-calendar-off" style={{ fontSize: 28, color: colors.sand.faint }} aria-hidden="true" />
            <p style={{ fontSize: 13, color: colors.text.muted, marginTop: 8 }}>Aucun episode sur cette periode.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <KeyStat value={String(stats.count)} label="episodes" />
              <KeyStat value={stats.avgIntensity} suffix="/10" label="intensite moy." />
              <KeyStat value={String(distinctConditions(filtered))} label="pathologies" />
            </div>

            <CalendarGrid episodes={allReal} year={now.getFullYear()} month={now.getMonth()} />

            <EpisodeDetailList episodes={filtered} />

            {stats.topTriggers.length > 0 && (
              <>
                <SectionTitle>Declencheurs les plus frequents</SectionTitle>
                <div style={{ marginBottom: 18 }}>
                  {stats.topTriggers.map((t, i) => (
                    <TriggerBar key={t.label} label={t.label} pct={Math.round((t.count / maxTrig) * 100)} count={t.count} last={i === stats.topTriggers.length - 1} />
                  ))}
                </div>
              </>
            )}

            {stats.treatments.length > 0 && (
              <>
                <SectionTitle>Traitements &amp; efficacite</SectionTitle>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginBottom: 20 }}>
                  <tbody>
                    <tr style={{ color: colors.sand.faint, fontSize: 11 }}>
                      <td style={{ paddingBottom: 6 }}>Traitement</td>
                      <td style={{ paddingBottom: 6, textAlign: 'center' }}>Prises</td>
                      <td style={{ paddingBottom: 6, textAlign: 'right' }}>A soulage</td>
                    </tr>
                    {stats.treatments.map((t) => (
                      <tr key={t.name} style={{ borderTop: `1px solid ${colors.clinical.bg}` }}>
                        <td style={{ padding: '7px 0', color: colors.text.body }}>{t.name}</td>
                        <td style={{ textAlign: 'center', color: colors.text.muted }}>{t.taken}</td>
                        <td style={{ textAlign: 'right', color: t.relieved >= t.taken / 2 ? colors.green.primaryDark : colors.amber.text, fontWeight: 600 }}>
                          {t.relieved} / {t.taken}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

function distinctConditions(episodes) {
  return new Set(episodes.map((e) => e.condition)).size
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: colors.clinical.ink, marginBottom: 10 }}>{children}</div>
}

function KeyStat({ value, suffix, label }) {
  return (
    <div style={{ flex: 1, background: colors.clinical.surfaceSoft, borderRadius: radius.sm, padding: '11px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: colors.clinical.ink }}>
        {value}{suffix && value !== '\u2014' && <span style={{ fontSize: 11, color: colors.sand.faint }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: 10, color: colors.text.soft, lineHeight: 1.3 }}>{label}</div>
    </div>
  )
}

function TriggerBar({ label, pct, count, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: last ? 0 : 8 }}>
      <span style={{ fontSize: 12, color: colors.text.muted, width: 80 }}>{label}</span>
      <span style={{ flex: 1, height: 8, background: colors.clinical.bg, borderRadius: 5, overflow: 'hidden' }}>
        <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: colors.green.primary }} />
      </span>
      <span style={{ fontSize: 11, color: colors.text.soft }}>{count}</span>
    </div>
  )
}

const DOT_COLOR = (v) => v <= 4 ? colors.green.leaf : v <= 7 ? colors.amber.bar : colors.coral.barStrong

function CalendarGrid({ episodes, year, month }) {
  const { weeks, monthLabel } = buildCalendarGrid(episodes, year, month)
  const dayHeaders = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  return (
    <div style={{ marginBottom: 18 }}>
      <SectionTitle>Calendrier — {monthLabel}</SectionTitle>
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
      <SectionTitle>Detail des episodes</SectionTitle>
      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: colors.sand.faint, fontSize: 10 }}>
            <th style={{ textAlign: 'left', paddingBottom: 6, fontWeight: 600 }}>Date</th>
            <th style={{ textAlign: 'left', paddingBottom: 6, fontWeight: 600 }}>Heure</th>
            <th style={{ textAlign: 'left', paddingBottom: 6, fontWeight: 600 }}>Pathologie</th>
            <th style={{ textAlign: 'center', paddingBottom: 6, fontWeight: 600 }}>Intensite</th>
            <th style={{ textAlign: 'right', paddingBottom: 6, fontWeight: 600 }}>Duree</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((ep) => {
            const d = new Date(ep.createdAt)
            const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
            return (
              <tr key={ep.id} style={{ borderTop: `1px solid ${colors.clinical.bg}` }}>
                <td style={{ padding: '6px 0', color: colors.text.body }}>{dateStr}</td>
                <td style={{ color: colors.text.muted }}>{formatHour(ep.createdAt)}</td>
                <td style={{ color: colors.text.body }}>{conditions[ep.condition]?.label || ep.condition}</td>
                <td style={{ textAlign: 'center', color: colors.text.muted }}>{ep.intensity || 0}/10</td>
                <td style={{ textAlign: 'right', color: colors.text.soft }}>{ep.duration || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
