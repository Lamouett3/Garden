import { colors, radius, font } from '../theme/tokens'
import { PrimaryButton } from '../components/ui'

import { useStore } from '../data/store'
import { computeStats, withoutBienetre } from '../data/stats'

export default function MedicalReport({ bp = 'mobile' }) {
  const { episodes: allEpisodes } = useStore()
  const episodes = withoutBienetre(allEpisodes)
  const stats = computeStats(episodes)

  const cardW = bp === 'desktop' ? 560 : bp === 'tablet' ? 480 : 360
  const maxTrig = Math.max(1, ...stats.topTriggers.map((t) => t.count))
  const period = monthLabel()

  const handleExport = () => window.print()

  if (episodes.length === 0) {
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

  return (
    <div style={{ background: colors.clinical.bg, borderRadius: radius.lg, padding: 24, display: 'flex', justifyContent: 'center' }} className="report-wrap">
      <div className="report-card" style={{
        width: '100%', maxWidth: cardW, background: colors.clinical.surface, borderRadius: radius.md,
        padding: '24px 22px', fontFamily: font.family, border: `0.5px solid ${colors.clinical.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: `1.5px solid ${colors.clinical.bg}`, paddingBottom: 14, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: colors.clinical.ink }}>Rapport de suivi</div>
            <div style={{ fontSize: 12, color: colors.text.soft, marginTop: 2 }}>{period}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: colors.text.muted }}>Mon suivi</div>
            <div style={{ fontSize: 11, color: colors.sand.faint }}>{episodes.length} episode{episodes.length > 1 ? 's' : ''}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <KeyStat value={String(stats.count)} label="episodes" />
          <KeyStat value={stats.avgIntensity} suffix="/10" label="intensite moy." />
          <KeyStat value={String(distinctConditions(episodes))} label="pathologies" />
        </div>

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

function monthLabel() {
  const d = new Date()
  const months = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre']
  return `${months[d.getMonth()]} ${d.getFullYear()}`
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
