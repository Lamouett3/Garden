import { useState } from 'react'
import { colors, radius, font } from '../theme/tokens'
import { PrimaryButton, Segmented, AnimatedNumber } from '../components/ui'

import { useStore } from '../data/store'
import { computeStats, withoutBienetre, filterByPeriod, periodLabel, getRefDate, formatHour } from '../data/stats'
import { conditions, zoneLabels } from '../data/conditions'
import { getCyclePhase } from '../data/storage'
import { getMoonPhase, getMoonPhaseName, getPlanetPositions } from '../data/astro'

// =====================================================================
// Rapport médical structuré — conçu pour être imprimé et remis à un
// professionnel de santé. Registre clinique sobre (cf. CLAUDE.md §3).
// =====================================================================

export default function MedicalReport({ bp = 'mobile' }) {
  const { episodes: allEpisodes, profile } = useStore()
  const allReal = withoutBienetre(allEpisodes)
  const [period, setPeriod] = useState('m')
  const [offset, setOffset] = useState(0)
  const showAstro = profile.moonOn || profile.planetsOn
  const [astroIncluded, setAstroIncluded] = useState(false)

  const filtered = filterByPeriod(allReal, period, offset)
  const stats = computeStats(filtered)
  const cardW = bp === 'desktop' ? 680 : bp === 'tablet' ? 560 : 420
  const pLabel = periodLabel(period, offset)

  function handlePeriodChange(p) { setPeriod(p); setOffset(0) }
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
  const sorted = [...filtered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  // --- Données structurées ---
  const byDate = groupByDate(sorted)
  const byCondition = groupByCondition(sorted)
  const intensityDist = computeIntensityDistribution(sorted)
  const zoneBreakdown = computeZoneBreakdown(sorted)
  const timeBreakdown = computeTimeBreakdown(sorted)
  const conditionBreakdown = computeConditionBreakdown(sorted)
  const avgPerDay = computeAvgPerDay(sorted)
  const maxIntDay = computeMaxIntensityDay(sorted)
  const evolution = computeEvolution(sorted)

  return (
    <div style={{ background: colors.clinical.bg, borderRadius: radius.lg, padding: bp === 'mobile' ? 12 : 24, display: 'flex', justifyContent: 'center' }} className="report-wrap">
      <div className="report-card" style={{
        width: '100%', maxWidth: cardW, background: colors.clinical.surface, borderRadius: radius.md,
        padding: bp === 'mobile' ? '22px 16px' : '32px 28px', fontFamily: font.family, border: `0.5px solid ${colors.clinical.border}`,
      }}>

        {/* ============ CONTROLES (ne s'impriment pas) ============ */}
        <div className="no-print" style={{ marginBottom: 20 }}>
          <Segmented variant="clinical"
            options={[{ value: 's', label: 'Semaine' }, { value: 'm', label: 'Mois' }, { value: 'a', label: 'Annee' }]}
            value={period} onChange={handlePeriodChange} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <NavBtn icon="ti-chevron-left" onClick={() => setOffset((o) => o - 1)} label="Periode precedente" />
            <button onClick={() => setOffset(0)}
              style={{
                border: 'none', background: offset === 0 ? colors.clinical.surfaceSoft : colors.clinical.bg,
                borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 600,
                color: colors.clinical.ink, cursor: 'pointer', fontFamily: 'inherit',
                minWidth: 140, textAlign: 'center',
              }}>
              {pLabel}
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
            {/* ============ 1. EN-TÊTE DU RAPPORT ============ */}
            <div style={{ borderBottom: `2px solid ${colors.clinical.ink}`, paddingBottom: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.clinical.ink, letterSpacing: '-0.3px' }}>
                Rapport de suivi symptomatologique
              </div>
              <div style={{ fontSize: 12, color: colors.text.muted, marginTop: 4 }}>
                Periode : {pLabel}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap', fontSize: 11, color: colors.text.muted }}>
                <span><b style={{ color: colors.clinical.ink }}>Profil :</b> {profile.gender === 'f' ? 'Femme' : profile.gender === 'h' ? 'Homme' : 'Non precise'}</span>
                {profile.cycleOn && profile.gender !== 'h' && (
                  <span><b style={{ color: colors.clinical.ink }}>Cycle :</b> {profile.cycleMode === 'pill' ? `Pilule (${profile.pillActiveDays || 21}+${profile.pillBreakDays || 7}j)` : `Naturel (${profile.cycleLength || 28}j)`}</span>
                )}
                <span><b style={{ color: colors.clinical.ink }}>Pathologies suivies :</b> {conditionBreakdown.map((c) => c.label).join(', ')}</span>
              </div>
              <div style={{ fontSize: 10, color: colors.sand.faint, marginTop: 6 }}>
                Genere le {fmtDate(now)} a {fmtTime(now)} — Application Pousse
              </div>
            </div>

            {/* ============ 2. SYNTHÈSE CLINIQUE ============ */}
            <Section title="1. Synthese clinique" icon="ti-report-medical">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginBottom: 14 }}>
                <KeyStat value={String(stats.count)} label="episodes totaux" />
                <KeyStat value={stats.avgIntensity} suffix="/10" label="intensite moyenne" />
                <KeyStat value={avgPerDay} label="episodes/jour" />
                <KeyStat value={String(conditionBreakdown.length)} label={conditionBreakdown.length > 1 ? 'pathologies' : 'pathologie'} />
              </div>

              {evolution && (
                <div style={{
                  background: evolution.trend === 'down' ? '#E7EFE8' : evolution.trend === 'up' ? '#FDF5F3' : colors.clinical.surfaceSoft,
                  borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12,
                  border: `1px solid ${evolution.trend === 'down' ? colors.green.leafLight : evolution.trend === 'up' ? '#E8C0B8' : colors.clinical.bg}`,
                  color: evolution.trend === 'down' ? colors.green.primaryDark : evolution.trend === 'up' ? '#8B4030' : colors.text.muted,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <i className={`ti ${evolution.trend === 'down' ? 'ti-trending-down' : evolution.trend === 'up' ? 'ti-trending-up' : 'ti-minus'}`} style={{ fontSize: 16 }} aria-hidden="true" />
                  {evolution.text}
                </div>
              )}

              {maxIntDay.value !== '—' && (
                <div style={{ fontSize: 12, color: colors.text.muted, marginBottom: 14 }}>
                  Pic d'intensite : <b style={{ color: colors.clinical.ink }}>{maxIntDay.value}/10</b> le {maxIntDay.date}
                  {maxIntDay.condition && <> ({maxIntDay.condition})</>}
                </div>
              )}

              {/* Distribution d'intensité */}
              <SubTitle>Repartition des intensites</SubTitle>
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 44, marginBottom: 4 }}>
                {intensityDist.map((d, i) => (
                  <div key={d.level} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="anim-barGrow" style={{
                      width: '100%', maxWidth: 28, borderRadius: 3,
                      height: d.count > 0 ? Math.max(4, d.pct * 0.4) : 0,
                      background: d.level <= 3 ? colors.green.leaf : d.level <= 6 ? colors.amber.bar : d.level <= 8 ? colors.coral.barStrong : '#C45050',
                      animationDelay: `${i * 0.04}s`,
                    }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                {intensityDist.map((d) => (
                  <div key={d.level} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: colors.text.faint }}>
                    {d.level}
                  </div>
                ))}
              </div>

              {/* Repartition horaire */}
              <SubTitle>Repartition horaire</SubTitle>
              <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 30, marginBottom: 4 }}>
                {timeBreakdown.map((t, i) => {
                  const maxC = Math.max(1, ...timeBreakdown.map((s) => s.count))
                  return (
                    <div key={t.slot} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '100%', maxWidth: 16, borderRadius: 2,
                        height: t.count > 0 ? Math.max(3, (t.count / maxC) * 26) : 0,
                        background: colors.green.primary, opacity: 0.65,
                      }} />
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 1, marginBottom: 6 }}>
                {timeBreakdown.map((t, i) => (
                  <div key={t.slot} style={{ flex: 1, textAlign: 'center', fontSize: 7, color: colors.text.faint }}>
                    {i % 4 === 0 ? t.slot : ''}
                  </div>
                ))}
              </div>
            </Section>

            {/* ============ 3. JOURNAL CHRONOLOGIQUE ============ */}
            <Section title="2. Journal chronologique" icon="ti-calendar">
              {byDate.map(({ dateStr, fullDate, episodes: dayEps }) => (
                <div key={dateStr} style={{ marginBottom: 14 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: colors.clinical.ink,
                    background: colors.clinical.surfaceSoft, padding: '6px 10px',
                    borderRadius: 6, marginBottom: 6,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span>{fullDate}</span>
                    <span style={{ fontSize: 10, fontWeight: 400, color: colors.text.soft }}>
                      {dayEps.length} episode{dayEps.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                    <tbody>
                      {dayEps.map((ep) => {
                        const condLabel = conditions[ep.condition]?.label || ep.customLabel || ep.condition
                        const zonesStr = (ep.zones || []).map((z) => zoneLabels[z] || z).join(', ')
                        const triggersStr = (ep.triggers || []).join(', ')
                        return (
                          <tr key={ep.id} style={{ borderBottom: `1px solid ${colors.clinical.bg}` }}>
                            <td style={{ padding: '7px 0', width: 50, verticalAlign: 'top', color: colors.text.muted, fontWeight: 600 }}>
                              {formatHour(ep.createdAt)}
                            </td>
                            <td style={{ padding: '7px 6px', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                <span style={{ fontWeight: 600, color: colors.clinical.ink }}>{condLabel}</span>
                                <IntensityBadge value={ep.intensity || 0} />
                                {ep.duration && <span style={{ fontSize: 10, color: colors.text.soft }}>{ep.duration}</span>}
                              </div>
                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 10, color: colors.text.muted, lineHeight: 1.6 }}>
                                {zonesStr && <span><b>Zones :</b> {zonesStr}</span>}
                                {triggersStr && <span><b>Declencheurs :</b> {triggersStr}</span>}
                                {ep.treatment && ep.treatment !== 'Aucun' && (
                                  <span>
                                    <b>Traitement :</b> {ep.treatment}
                                    {ep.efficacy && <> — efficacite : <b>{ep.efficacy}</b></>}
                                    {!ep.efficacy && <> — <i>efficacite non renseignee</i></>}
                                  </span>
                                )}
                                {ep.extra?.length > 0 && <span><b>Details :</b> {ep.extra.join(', ')}</span>}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </Section>

            {/* ============ 4. ANALYSE PAR PATHOLOGIE ============ */}
            {conditionBreakdown.length > 0 && (
              <Section title="3. Analyse par pathologie" icon="ti-stethoscope">
                {byCondition.map(({ key, label, episodes: condEps }) => {
                  const condStats = computeStats(condEps)
                  const condZones = computeZoneBreakdown(condEps)
                  const intensities = condEps.map((e) => e.intensity || 0)
                  const minI = Math.min(...intensities)
                  const maxI = Math.max(...intensities)

                  return (
                    <div key={key} style={{
                      border: `1px solid ${colors.clinical.bg}`, borderRadius: 8,
                      padding: '14px 14px 10px', marginBottom: 12,
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: colors.clinical.ink, marginBottom: 8 }}>
                        {label}
                        <span style={{ fontSize: 11, fontWeight: 400, color: colors.text.soft, marginLeft: 8 }}>
                          {condEps.length} episode{condEps.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 6, marginBottom: 10 }}>
                        <MiniStat label="Intensite moy." value={condStats.avgIntensity} suffix="/10" />
                        <MiniStat label="Plage" value={`${minI}–${maxI}`} suffix="/10" />
                        {condZones.length > 0 && <MiniStat label="Zone principale" value={condZones[0].label} />}
                      </div>

                      {/* Declencheurs pour cette pathologie */}
                      {condStats.topTriggers.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: colors.text.soft, marginBottom: 4 }}>Declencheurs identifies</div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {condStats.topTriggers.map((t) => (
                              <span key={t.label} style={{
                                fontSize: 10, padding: '3px 8px', borderRadius: 6,
                                background: colors.clinical.surfaceSoft, color: colors.text.body,
                                border: `1px solid ${colors.clinical.bg}`,
                              }}>
                                {t.label} <b>({t.count})</b>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Traitements pour cette pathologie */}
                      {condStats.treatments.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: colors.text.soft, marginBottom: 4 }}>Traitements</div>
                          {condStats.treatments.map((t) => {
                            const rate = t.taken > 0 ? Math.round((t.relieved / t.taken) * 100) : 0
                            return (
                              <div key={t.name} style={{ fontSize: 11, color: colors.text.body, marginBottom: 2 }}>
                                {t.name} — {t.taken} prise{t.taken > 1 ? 's' : ''}, soulagement {t.relieved}/{t.taken}
                                {' '}
                                <EfficacyTag rate={rate} />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </Section>
            )}

            {/* ============ 5. CORRELATIONS ============ */}
            <Section title="4. Correlations et facteurs" icon="ti-chart-dots-3">
              {/* Zones corporelles */}
              {zoneBreakdown.length > 0 && (
                <>
                  <SubTitle>Zones corporelles touchees</SubTitle>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                    {zoneBreakdown.map((z) => {
                      const pct = Math.round((z.count / filtered.length) * 100)
                      return (
                        <span key={z.zone} style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 6,
                          background: colors.clinical.surfaceSoft, color: colors.text.body,
                          border: `1px solid ${colors.clinical.bg}`,
                        }}>
                          {z.label} — <b>{z.count}</b> ({pct}%)
                        </span>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Declencheurs globaux */}
              {stats.topTriggers.length > 0 && (
                <>
                  <SubTitle>Declencheurs les plus frequents</SubTitle>
                  <div style={{ marginBottom: 14 }}>
                    {stats.topTriggers.map((t, i) => {
                      const pct = Math.round((t.count / filtered.length) * 100)
                      const maxTrig = Math.max(1, ...stats.topTriggers.map((x) => x.count))
                      return (
                        <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: colors.text.muted, width: 100, flexShrink: 0 }}>{t.label}</span>
                          <span style={{ flex: 1, height: 7, background: colors.clinical.bg, borderRadius: 4, overflow: 'hidden' }}>
                            <span className="anim-barFillX" style={{ display: 'block', width: `${Math.round((t.count / maxTrig) * 100)}%`, height: '100%', background: colors.green.primary, borderRadius: 4 }} />
                          </span>
                          <span style={{ fontSize: 10, color: colors.text.soft, width: 55, textAlign: 'right' }}>{t.count}x ({pct}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Cycle menstruel */}
              {profile.cycleOn && profile.gender !== 'h' && sorted.length > 0 && (
                <>
                  <SubTitle>Correlation avec le cycle</SubTitle>
                  <CycleCorrelation episodes={sorted} profile={profile} />
                </>
              )}
            </Section>

            {/* ============ 6. TRAITEMENTS ============ */}
            {stats.treatments.length > 0 && (
              <Section title="5. Bilan therapeutique" icon="ti-pill">
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', marginBottom: 6 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${colors.clinical.bg}` }}>
                      <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 700, color: colors.clinical.ink, fontSize: 10 }}>Traitement</th>
                      <th style={{ textAlign: 'center', padding: '6px 0', fontWeight: 700, color: colors.clinical.ink, fontSize: 10 }}>Prises</th>
                      <th style={{ textAlign: 'center', padding: '6px 0', fontWeight: 700, color: colors.clinical.ink, fontSize: 10 }}>Soulagement</th>
                      <th style={{ textAlign: 'center', padding: '6px 0', fontWeight: 700, color: colors.clinical.ink, fontSize: 10 }}>En attente</th>
                      <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 700, color: colors.clinical.ink, fontSize: 10 }}>Efficacite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.treatments.map((t) => {
                      const rate = t.taken > 0 ? Math.round((t.relieved / t.taken) * 100) : 0
                      const pending = filtered.filter((e) => e.treatment === t.name && !e.efficacy).length
                      return (
                        <tr key={t.name} style={{ borderBottom: `1px solid ${colors.clinical.bg}` }}>
                          <td style={{ padding: '8px 0', color: colors.text.body }}>{t.name}</td>
                          <td style={{ textAlign: 'center', color: colors.text.muted }}>{t.taken}</td>
                          <td style={{ textAlign: 'center', color: colors.text.body, fontWeight: 600 }}>{t.relieved}/{t.taken}</td>
                          <td style={{ textAlign: 'center', color: pending > 0 ? colors.amber.text : colors.text.faint, fontSize: 10 }}>
                            {pending > 0 ? `${pending} en attente` : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}><EfficacyTag rate={rate} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Section>
            )}

            {/* ============ 7. SECTION ASTRO (optionnelle) ============ */}
            {showAstro && (
              <>
                <div style={{
                  borderTop: `1.5px dashed ${colors.clinical.bg}`, paddingTop: 14, marginBottom: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <i className="ti ti-moon-stars" style={{ fontSize: 16, color: colors.text.soft }} aria-hidden="true" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.clinical.ink }}>Annexe — Reperes astronomiques</div>
                      <div style={{ fontSize: 10, color: colors.text.soft }}>Section informative, sans valeur medicale</div>
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
                  <AstroSection episodes={sorted} showMoon={profile.moonOn} showPlanets={profile.planetsOn} />
                </div>
              </>
            )}

            {/* ============ 8. NOTE MEDICO-LEGALE ============ */}
            <div style={{
              background: colors.clinical.surfaceSoft, borderRadius: 8,
              padding: '14px 16px', marginTop: 14, borderLeft: `3px solid ${colors.clinical.bg}`,
            }}>
              <div style={{ fontSize: 10, color: colors.text.muted, lineHeight: 1.7 }}>
                <strong style={{ color: colors.clinical.ink }}>Avertissement :</strong> Ce rapport est genere automatiquement a partir de donnees auto-declaratives saisies par le patient via l'application Pousse. Il ne constitue pas un diagnostic medical. Les informations presentees sont destinees a faciliter le dialogue entre le patient et son professionnel de sante, et a fournir un historique structure des symptomes rapportes. L'interpretation clinique de ces donnees releve exclusivement du professionnel de sante.
              </div>
            </div>
          </>
        )}

        {/* ============ BOUTON EXPORT ============ */}
        <div className="no-print" style={{ marginTop: 20 }}>
          <PrimaryButton icon="ti-download" dark onClick={handleExport}>Exporter en PDF</PrimaryButton>
          <p style={{ textAlign: 'center', fontSize: 11, color: colors.sand.faint, marginTop: 10, marginBottom: 0 }}>
            Donnees personnelles {'\u00b7'} partagees uniquement a ton initiative
          </p>
        </div>
      </div>
    </div>
  )
}

// =====================================================================
// Helpers de calcul
// =====================================================================

function fmtDate(d) {
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const mois = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre']
  return `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`
}

function fmtTime(d) {
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtShortDate(d) {
  const mois = ['jan', 'fev', 'mar', 'avr', 'mai', 'jun', 'jul', 'aou', 'sep', 'oct', 'nov', 'dec']
  return `${d.getDate()} ${mois[d.getMonth()]}`
}

function groupByDate(episodes) {
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const mois = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre']
  const map = {}
  episodes.forEach((ep) => {
    const d = new Date(ep.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!map[key]) map[key] = {
      dateStr: key,
      fullDate: `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`,
      episodes: [],
    }
    map[key].episodes.push(ep)
  })
  return Object.values(map).sort((a, b) => a.dateStr.localeCompare(b.dateStr))
}

function groupByCondition(episodes) {
  const map = {}
  episodes.forEach((ep) => {
    const key = ep.condition
    if (!map[key]) map[key] = {
      key,
      label: conditions[key]?.label || ep.customLabel || key,
      episodes: [],
    }
    map[key].episodes.push(ep)
  })
  return Object.values(map).sort((a, b) => b.episodes.length - a.episodes.length)
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
  episodes.forEach((e) => { slots[new Date(e.createdAt).getHours()].count++ })
  return slots
}

function computeAvgPerDay(episodes) {
  if (episodes.length === 0) return '0'
  const days = new Set(episodes.map((e) => {
    const d = new Date(e.createdAt)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }))
  const avg = episodes.length / Math.max(1, days.size)
  return (Math.round(avg * 10) / 10).toString().replace('.', ',')
}

function computeMaxIntensityDay(episodes) {
  if (episodes.length === 0) return { value: '—', date: '—', condition: null }
  let maxI = 0, maxDate = '', maxCond = null
  episodes.forEach((e) => {
    if ((e.intensity || 0) >= maxI) {
      maxI = e.intensity || 0
      const d = new Date(e.createdAt)
      maxDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
      maxCond = conditions[e.condition]?.label || e.condition
    }
  })
  return { value: String(maxI), date: maxDate, condition: maxCond }
}

function computeEvolution(episodes) {
  if (episodes.length < 3) return null
  const half = Math.floor(episodes.length / 2)
  const firstHalf = episodes.slice(0, half)
  const secondHalf = episodes.slice(half)
  const avg1 = firstHalf.reduce((s, e) => s + (e.intensity || 0), 0) / firstHalf.length
  const avg2 = secondHalf.reduce((s, e) => s + (e.intensity || 0), 0) / secondHalf.length
  const diff = avg2 - avg1
  if (Math.abs(diff) < 0.5) return { trend: 'stable', text: `Intensite stable sur la periode (${(Math.round(avg2 * 10) / 10).toString().replace('.', ',')}/10 en moyenne).` }
  if (diff < 0) return { trend: 'down', text: `Tendance a l'amelioration : intensite moyenne passee de ${(Math.round(avg1 * 10) / 10).toString().replace('.', ',')}/10 a ${(Math.round(avg2 * 10) / 10).toString().replace('.', ',')}/10.` }
  return { trend: 'up', text: `Tendance a l'aggravation : intensite moyenne passee de ${(Math.round(avg1 * 10) / 10).toString().replace('.', ',')}/10 a ${(Math.round(avg2 * 10) / 10).toString().replace('.', ',')}/10.` }
}

// =====================================================================
// Composants UI cliniques
// =====================================================================

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

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: 14, fontWeight: 700, color: colors.clinical.ink,
        borderBottom: `1.5px solid ${colors.clinical.bg}`, paddingBottom: 8, marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: 16, color: colors.text.soft }} aria-hidden="true" />}
        {title}
      </div>
      {children}
    </div>
  )
}

function SubTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: colors.text.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
      {children}
    </div>
  )
}

function KeyStat({ value, suffix, label }) {
  return (
    <div style={{ background: colors.clinical.surfaceSoft, borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: colors.clinical.ink }}>
        <AnimatedNumber value={value} />{suffix && value !== '\u2014' && <span style={{ fontSize: 11, color: colors.sand.faint }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: 9, color: colors.text.soft, lineHeight: 1.3 }}>{label}</div>
    </div>
  )
}

function MiniStat({ label, value, suffix }) {
  return (
    <div style={{ background: colors.clinical.surfaceSoft, borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: colors.text.soft, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.clinical.ink }}>
        {value}{suffix && <span style={{ fontSize: 10, fontWeight: 400, color: colors.sand.faint }}>{suffix}</span>}
      </div>
    </div>
  )
}

function IntensityBadge({ value }) {
  const bg = value <= 3 ? '#E7EFE8' : value <= 6 ? colors.amber.bg : '#FDF0F3'
  const color = value <= 3 ? colors.green.primaryDark : value <= 6 ? colors.amber.text : '#9A3D5E'
  return (
    <span style={{
      display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
      background: bg, color,
    }}>{value}/10</span>
  )
}

function EfficacyTag({ rate }) {
  const bg = rate >= 60 ? '#E7EFE8' : rate >= 30 ? colors.amber.bg : '#FDF0F3'
  const color = rate >= 60 ? colors.green.primaryDark : rate >= 30 ? colors.amber.text : '#9A3D5E'
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 600,
      background: bg, color,
    }}>{rate}%</span>
  )
}

function CycleCorrelation({ episodes, profile }) {
  const phases = {}
  episodes.forEach((ep) => {
    const d = new Date(ep.createdAt)
    // Simulate phase at that date
    const tempProfile = { ...profile, lastPeriod: profile.lastPeriod, pillPackStart: profile.pillPackStart }
    const phase = getCyclePhase(tempProfile)
    if (!phase) return
    const key = phase.label
    if (!phases[key]) phases[key] = { label: key, count: 0, totalIntensity: 0 }
    phases[key].count++
    phases[key].totalIntensity += (ep.intensity || 0)
  })
  const phaseList = Object.values(phases).sort((a, b) => b.count - a.count)
  if (phaseList.length === 0) return <div style={{ fontSize: 11, color: colors.text.faint, marginBottom: 14 }}>Donnees insuffisantes pour correler.</div>

  return (
    <div style={{ marginBottom: 14 }}>
      {phaseList.map((p) => {
        const avg = Math.round((p.totalIntensity / p.count) * 10) / 10
        const pct = Math.round((p.count / episodes.length) * 100)
        return (
          <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: 11 }}>
            <span style={{ width: 90, color: colors.text.muted, flexShrink: 0 }}>{p.label}</span>
            <span style={{ flex: 1, height: 7, background: colors.clinical.bg, borderRadius: 4, overflow: 'hidden' }}>
              <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: colors.green.primary, borderRadius: 4 }} />
            </span>
            <span style={{ fontSize: 10, color: colors.text.soft, width: 85, textAlign: 'right' }}>
              {p.count}x · moy {String(avg).replace('.', ',')}/10
            </span>
          </div>
        )
      })}
    </div>
  )
}

// =====================================================================
// Section astronomique (optionnelle, sans valeur médicale)
// =====================================================================

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

const PLANET_LABELS = { mercure: 'Mercure', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturne: 'Saturne' }
const ZODIAC = ['Belier', 'Taureau', 'Gemeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons']
function zodiacSign(angle) { return ZODIAC[Math.floor(((angle % 360) + 360) % 360 / 30)] }

function AstroSection({ episodes, showMoon, showPlanets }) {
  // Avertissement
  const warning = (
    <div style={{
      background: '#FFF8EE', borderRadius: 8, padding: '10px 14px', marginBottom: 14,
      border: `1.5px solid ${colors.amber.border}`,
      display: 'flex', alignItems: 'flex-start', gap: 8,
    }}>
      <i className="ti ti-alert-triangle" style={{ color: colors.amber.text, fontSize: 16, marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
      <div style={{ fontSize: 10, color: colors.amber.text, lineHeight: 1.6 }}>
        <b>Section informative — sans valeur medicale.</b> Les correlations presentees sont des observations purement statistiques. Elles ne constituent pas une analyse medicale.
      </div>
    </div>
  )

  // Moon correlation
  let moonSection = null
  if (showMoon && episodes.length > 0) {
    const buckets = MOON_PHASES.map((p) => ({ ...p, count: 0, totalIntensity: 0 }))
    episodes.forEach((ep) => {
      const idx = getMoonPhaseIndex(getMoonPhase(new Date(ep.createdAt)))
      buckets[idx].count++
      buckets[idx].totalIntensity += (ep.intensity || 0)
    })
    buckets.forEach((b) => { b.avgIntensity = b.count > 0 ? Math.round((b.totalIntensity / b.count) * 10) / 10 : 0 })
    const maxC = Math.max(1, ...buckets.map((b) => b.count))

    moonSection = (
      <div style={{ marginBottom: 14 }}>
        <SubTitle>Repartition lunaire</SubTitle>
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 44, marginBottom: 4 }}>
          {buckets.map((b, i) => (
            <div key={b.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '100%', maxWidth: 28, borderRadius: 3,
                height: b.count > 0 ? Math.max(4, (b.count / maxC) * 38) : 0,
                background: b.key === 'pleine' ? '#C4B17C' : b.key === 'nouvelle' ? '#5A6B5E' : colors.green.leaf,
                opacity: b.count > 0 ? 0.85 : 0.2,
              }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
          {buckets.map((b) => (
            <div key={b.key} style={{ flex: 1, textAlign: 'center' }}>
              <i className={`ti ${b.icon}`} style={{ fontSize: 10, color: b.color }} aria-hidden="true" />
              <div style={{ fontSize: 8, color: colors.text.faint }}>{b.count || ''}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Planet correlation
  let planetSection = null
  if (showPlanets && episodes.length > 0) {
    const planetIds = ['mercure', 'venus', 'mars', 'jupiter', 'saturne']
    const results = planetIds.map((pid) => {
      const signCounts = {}
      episodes.forEach((ep) => {
        const planets = getPlanetPositions(new Date(ep.createdAt))
        const p = planets.find((pp) => pp.id === pid)
        if (p) {
          const sign = zodiacSign(p.angle)
          signCounts[sign] = (signCounts[sign] || 0) + 1
        }
      })
      const top = Object.entries(signCounts).sort((a, b) => b[1] - a[1])[0]
      return { id: pid, label: PLANET_LABELS[pid], topSign: top ? top[0] : '—', topCount: top ? top[1] : 0, pct: top ? Math.round((top[1] / episodes.length) * 100) : 0 }
    }).filter((r) => r.pct >= 15)

    if (results.length > 0) {
      planetSection = (
        <div style={{ marginBottom: 14 }}>
          <SubTitle>Positions planetaires dominantes</SubTitle>
          {results.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 11 }}>
              <span style={{ width: 70, color: colors.text.muted, flexShrink: 0 }}>{r.label}</span>
              <span style={{ flex: 1, height: 6, background: colors.clinical.bg, borderRadius: 3, overflow: 'hidden' }}>
                <span style={{ display: 'block', width: `${r.pct}%`, height: '100%', background: colors.green.primary, borderRadius: 3, opacity: 0.6 }} />
              </span>
              <span style={{ fontSize: 10, color: colors.text.soft, width: 80, textAlign: 'right' }}>{r.topSign} ({r.pct}%)</span>
            </div>
          ))}
        </div>
      )
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      {warning}
      {moonSection}
      {planetSection}
    </div>
  )
}
