import { useState } from 'react'
import { colors, radius } from '../theme/tokens'
import { Screen, StreakBadge, PrimaryButton, AnimatedNumber, ConfirmDialog, useToast } from '../components/ui'
import GrowingGarden from '../components/GrowingGarden'
import PlanetaryWidget from '../components/PlanetaryWidget'
import { useStore } from '../data/store'
import { gardenLoggedDays, currentStreak, dayKey, getCyclePhase } from '../data/storage'
import { conditions, efficacyLevels } from '../data/conditions'

const CYCLE_COLORS = {
  pink: { bg: '#FDF0F3', text: '#9A3D5E', accent: '#D4537E' },
  green: { bg: colors.green.soft, text: colors.green.primaryDark, accent: colors.green.primary },
  amber: { bg: colors.amber.bg, text: colors.amber.text, accent: colors.amber.border },
  sand: { bg: colors.sand.bg, text: colors.sand.text, accent: colors.sand.faint },
}

const GARDEN_GOAL = 7

export default function Home({ onLog, onSeeHistory, bp = 'mobile' }) {
  const { episodes, profile, updateProfile, addEpisode, editEpisode } = useStore()
  const toast = useToast()
  const [confirmHarvest, setConfirmHarvest] = useState(false)
  const gardenDays = gardenLoggedDays(episodes, profile.gardenStartDate)
  const gardenDayCount = gardenDays.size
  const gardenComplete = gardenDayCount >= GARDEN_GOAL
  const streak = currentStreak(episodes)
  const today = dayKey(new Date())
  const loggedToday = episodes.some((e) => dayKey(e.createdAt) === today)
  const cyclePhase = (profile.gender === 'f' || profile.gender === 'n') ? getCyclePhase(profile) : null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bel apres-midi' : 'Bonsoir'
  const wide = bp === 'desktop'

  function handleHarvest() {
    updateProfile({
      completedGardens: (profile.completedGardens || 0) + 1,
      gardenStartDate: today,
    })
    setConfirmHarvest(false)
    toast('Recolte terminee ! Un nouveau cycle commence.', 'success')
  }

  function handleAllGood() {
    addEpisode({
      condition: 'bienetre',
      zones: [],
      intensity: 0,
      duration: '',
      triggers: [],
      treatment: 'Aucun',
      efficacy: null,
      extra: [],
    })
    toast('Journee enregistree, continue comme ca !', 'success')
  }

  const gardenProgressRaw = gardenDayCount === 0
    ? null
    : gardenComplete
      ? null
      : { count: gardenDayCount, goal: GARDEN_GOAL }
  const gardenProgressText = gardenDayCount === 0
    ? 'Note un premier episode pour planter ta premiere pousse'
    : gardenComplete
      ? 'Ton jardin est magnifique !'
      : null

  const cycleCard = cyclePhase && (
    <div className="anim-fadeInUp anim-d2" style={{
      background: CYCLE_COLORS[cyclePhase.color].bg, borderRadius: radius.md,
      padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: CYCLE_COLORS[cyclePhase.color].accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9,
      }}>
        <i className={`ti ${cyclePhase.icon}`}
          style={{ fontSize: 16, color: '#fff' }} aria-hidden="true" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: CYCLE_COLORS[cyclePhase.color].text }}>
          {cyclePhase.phaseDay != null ? cyclePhase.label : `Phase ${cyclePhase.label.toLowerCase()}`}
        </div>
        <div style={{ fontSize: 11, color: CYCLE_COLORS[cyclePhase.color].text, opacity: 0.7 }}>
          {cyclePhase.phaseDay != null
            ? `Jour ${cyclePhase.phaseDay}/${cyclePhase.phaseTotal}`
            : `Jour ${cyclePhase.day}/${cyclePhase.total} du cycle`}
        </div>
      </div>
    </div>
  )

  const todayCard = loggedToday && (
    <div className="anim-fadeInUp anim-d3" style={{ background: colors.green.soft, borderRadius: radius.md, padding: '13px 14px', display: 'flex', gap: 9, alignItems: 'center' }}>
      <i className="ti ti-check" style={{ color: colors.green.primaryDark, fontSize: 18 }} aria-hidden="true" />
      <span style={{ fontSize: 13, color: colors.green.primaryDark }}>Tu as deja pris soin de toi aujourd'hui.</span>
    </div>
  )

  // Efficacy follow-up: find recent episodes (last 48h) with treatment but no efficacy rating
  const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000
  const pendingEfficacy = episodes.filter((e) =>
    e.treatment && e.treatment !== 'Aucun' && !e.efficacy &&
    new Date(e.createdAt).getTime() > twoDaysAgo
  )

  const efficacyCard = pendingEfficacy.length > 0 && (
    <div className="anim-fadeInUp anim-d4" style={{
      background: colors.amber.bg, borderRadius: radius.md, padding: '12px 14px',
      border: `1px solid ${colors.amber.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <i className="ti ti-bell" style={{ color: colors.amber.text, fontSize: 16 }} aria-hidden="true" />
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.amber.text }}>
          {pendingEfficacy.length === 1 ? 'Traitement en attente' : `${pendingEfficacy.length} traitements en attente`}
        </span>
      </div>
      {pendingEfficacy.slice(0, 2).map((ep) => {
        const condLabel = conditions[ep.condition]?.label || ep.condition
        return (
          <div key={ep.id} style={{
            background: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '8px 10px', marginBottom: 6,
          }}>
            <div style={{ fontSize: 12, color: colors.amber.text, marginBottom: 6 }}>
              {condLabel} — {ep.treatment}
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {efficacyLevels.map((lvl) => (
                <button key={lvl} onClick={() => {
                  editEpisode(ep.id, { efficacy: lvl })
                  toast(`Efficacite notee : ${lvl}`, 'success')
                }}
                  style={{
                    flex: 1, fontSize: 11, padding: '5px 0', borderRadius: 6,
                    border: `1px solid ${colors.amber.border}`, background: 'rgba(255,255,255,0.7)',
                    color: colors.amber.text, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {pendingEfficacy.length > 2 && (
        <div style={{ fontSize: 11, color: colors.amber.text, opacity: 0.7, textAlign: 'center', marginTop: 2 }}>
          +{pendingEfficacy.length - 2} autre{pendingEfficacy.length - 2 > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )

  const buttonsBlock = (
    <div style={{ display: 'flex', flexDirection: wide ? 'row' : 'column', gap: 10 }}>
      <div style={{ flex: 1 }}>
        <PrimaryButton icon="ti-plus" onClick={onLog}>Noter un episode</PrimaryButton>
      </div>
      {!loggedToday && (
        <button onClick={handleAllGood}
          style={{
            flex: 1, border: `1.5px solid ${colors.green.leafLight}`,
            background: colors.green.soft, color: colors.green.primaryDark, padding: 13, borderRadius: radius.lg,
            fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          <i className="ti ti-sun" aria-hidden="true" /> Tout va bien aujourd'hui
        </button>
      )}
      <button onClick={onSeeHistory}
        style={{
          flex: 1, border: `1.5px solid ${colors.border.soft}`,
          background: 'transparent', color: colors.text.muted, padding: 13, borderRadius: radius.lg,
          fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
        <i className="ti ti-chart-bar" aria-hidden="true" /> Voir mon historique
      </button>
    </div>
  )

  return (
    <Screen bp={bp} wide={wide}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: colors.text.soft }}>{greeting}</div>
          <div style={{ fontSize: wide ? 24 : 19, fontWeight: 700, color: colors.text.title }}>Ton jardin</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(profile.completedGardens || 0) > 0 && (
            <StreakBadge icon="ti-trophy"><AnimatedNumber value={profile.completedGardens} /> recolte{profile.completedGardens > 1 ? 's' : ''}</StreakBadge>
          )}
          <StreakBadge><AnimatedNumber value={streak} /> j</StreakBadge>
        </div>
      </div>

      {gardenComplete && (
        <div className="anim-scaleIn" style={{
          background: colors.amber.bg, borderRadius: radius.lg,
          padding: '18px 16px', marginBottom: 14, textAlign: 'center',
          border: `1.5px solid ${colors.amber.border}`,
        }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>
            <i className="ti ti-confetti" style={{ color: colors.amber.text, fontSize: 24 }} aria-hidden="true" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.amber.text, marginBottom: 4 }}>
            Ton jardin est en fleurs !
          </div>
          <div style={{ fontSize: 12, color: colors.amber.text, opacity: 0.8, marginBottom: 14 }}>
            {GARDEN_GOAL} jours de suivi, bravo pour ta regularite
          </div>
          <button onClick={() => setConfirmHarvest(true)}
            style={{
              border: 'none', background: colors.amber.border, color: '#fff',
              padding: '10px 22px', borderRadius: radius.md, fontSize: 14,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 7,
            }}>
            <i className="ti ti-plant" aria-hidden="true" /> Recolter et replanter
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmHarvest}
        title="Recolter ton jardin ?"
        message="Ton jardin actuel sera recolte et un nouveau cycle de 7 jours commencera. Cette action est irreversible."
        confirmLabel="Recolter"
        onConfirm={handleHarvest}
        onCancel={() => setConfirmHarvest(false)}
      />

      {wide ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24, alignItems: 'start', marginBottom: 20 }}>
            <div>
              <div style={{ background: colors.green.bg, borderRadius: radius.lg, padding: '24px 20px 12px' }}>
                <GrowingGarden days={gardenDayCount} />
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, color: colors.text.faint, marginTop: 8 }}>
                {gardenProgressText || <><AnimatedNumber value={gardenProgressRaw.count} />/{gardenProgressRaw.goal} jours dans ce cycle</>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cycleCard}
              {todayCard}
              {efficacyCard}
              {(profile.moonOn || profile.planetsOn) && <PlanetaryWidget compact showMoon={profile.moonOn} showPlanets={profile.planetsOn} />}
            </div>
          </div>
          {buttonsBlock}
        </>
      ) : (
        <>
          <div style={{
            background: colors.green.bg, borderRadius: radius.lg,
            padding: '16px 8px 6px', marginBottom: 8,
          }}>
            <GrowingGarden days={gardenDayCount} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: colors.text.faint, marginBottom: 18 }}>
            {gardenProgressText}
          </div>

          {cycleCard && <div style={{ marginBottom: 12 }}>{cycleCard}</div>}
          {todayCard && <div style={{ marginBottom: 12 }}>{todayCard}</div>}
          {efficacyCard && <div style={{ marginBottom: 12 }}>{efficacyCard}</div>}

          {(profile.moonOn || profile.planetsOn) && (
            <div style={{ marginBottom: 14 }}>
              <PlanetaryWidget showMoon={profile.moonOn} showPlanets={profile.planetsOn} />
            </div>
          )}

          <div style={{ flex: 1 }} />
          {buttonsBlock}
        </>
      )}
    </Screen>
  )
}
