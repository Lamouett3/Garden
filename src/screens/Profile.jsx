import { colors, radius } from '../theme/tokens'
import { Screen, ScreenHeader, Toggle } from '../components/ui'
import { useStore } from '../data/store'

export default function Profile({ bp = 'mobile', onLogout }) {
  const { profile, updateProfile } = useStore()

  const genders = [
    { value: 'f', label: 'Femme' },
    { value: 'h', label: 'Homme' },
    { value: 'n', label: 'Non precise' },
  ]

  return (
    <Screen bp={bp}>
      <ScreenHeader title="Mon profil" />

      <Label>Je suis</Label>
      <div style={{ display: 'flex', gap: 7, marginBottom: 20 }}>
        {genders.map((g) => {
          const active = g.value === profile.gender
          return (
            <button key={g.value} onClick={() => updateProfile({ gender: g.value })}
              style={{
                flex: 1, fontSize: 12.5, padding: '9px 0', borderRadius: radius.md, cursor: 'pointer',
                border: `1.5px solid ${active ? colors.green.primary : colors.border.soft}`,
                background: active ? colors.green.primary : 'transparent',
                color: active ? '#fff' : colors.text.muted,
              }}>
              {g.label}
            </button>
          )
        })}
      </div>

      {(profile.gender === 'f' || profile.gender === 'n') && (
        <div style={{ background: colors.green.soft, borderRadius: radius.lg, padding: '15px 15px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: colors.text.title, display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="ti ti-droplet" aria-hidden="true" /> Mon cycle
            </span>
            <button onClick={() => updateProfile({ cycleOn: !profile.cycleOn })} aria-label="Activer le suivi du cycle"
              style={{ border: 'none', background: 'transparent', padding: 0 }}>
              <Toggle on={profile.cycleOn} />
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#6E8174', marginBottom: 13 }}>Pour relier tes episodes a ton cycle</div>
          {profile.cycleOn && (
            <div style={{ display: 'flex', gap: 10 }}>
              <MiniField label="Duree cycle">
                <input type="number" value={profile.cycleLength}
                  onChange={(e) => updateProfile({ cycleLength: Number(e.target.value) })}
                  style={inputStyle} /> j
              </MiniField>
              <MiniField label="Dernieres regles">
                <input type="date" value={profile.lastPeriod}
                  onChange={(e) => updateProfile({ lastPeriod: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }} />
              </MiniField>
            </div>
          )}
        </div>
      )}

      <Label style={{ marginTop: 18 }}>Options</Label>

      <div style={{ background: colors.sand.bg, borderRadius: radius.lg, padding: 15, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text.body, display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="ti ti-moon" aria-hidden="true" /> Reperes lunaires &amp; planetaires
            </div>
            <div style={{ fontSize: 12, color: colors.sand.text, marginTop: 4, lineHeight: 1.5 }}>
              Affiche la phase lunaire et les positions planetaires a cote de tes journees.
            </div>
          </div>
          <button onClick={() => updateProfile({ planetsOn: !profile.planetsOn })}
            aria-label="Activer les reperes lunaires et planetaires"
            style={{ border: 'none', background: 'transparent', padding: 0, marginTop: 2 }}>
            <Toggle on={profile.planetsOn} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 11, background: colors.amber.bg, borderRadius: radius.sm, padding: '8px 10px' }}>
          <i className="ti ti-info-circle" style={{ color: colors.amber.text, fontSize: 15 }} aria-hidden="true" />
          <span style={{ fontSize: 11, color: colors.amber.text, lineHeight: 1.45 }}>
            Repere personnel sans valeur medicale. N'apparait pas dans le rapport medecin.
          </span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <p style={{ textAlign: 'center', fontSize: 12, color: colors.text.faint, marginTop: 6, marginBottom: 16 }}>
        Desactive par defaut {'\u00b7'} activable quand tu veux
      </p>

      {onLogout && (
        <button onClick={onLogout}
          style={{
            width: '100%', border: `1.5px solid ${colors.border.soft}`,
            background: 'transparent', color: colors.text.muted, padding: 13,
            borderRadius: radius.lg, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
          <i className="ti ti-logout" aria-hidden="true" /> Se deconnecter
        </button>
      )}
    </Screen>
  )
}

const inputStyle = {
  border: `1px solid ${colors.border.soft}`, borderRadius: 8, padding: '4px 6px',
  fontSize: 14, fontWeight: 600, color: colors.text.body, width: 40,
  background: colors.green.surface, fontFamily: 'inherit',
}

function Label({ children, style }) {
  return <div style={{ fontSize: 13, color: colors.text.muted, marginBottom: 8, ...style }}>{children}</div>
}

function MiniField({ label, children }) {
  return (
    <div style={{ flex: 1, background: colors.green.surface, borderRadius: radius.sm, padding: '9px 11px' }}>
      <div style={{ fontSize: 11, color: '#8A9B8E', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: colors.text.body, display: 'flex', alignItems: 'center', gap: 4 }}>{children}</div>
    </div>
  )
}
