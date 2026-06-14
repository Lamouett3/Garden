import { useRef, useState } from 'react'
import { colors, radius } from '../theme/tokens'
import { Screen, ScreenHeader, Toggle, Segmented, useToast, ConfirmDialog } from '../components/ui'
import { useStore } from '../data/store'
import { replaceAllEpisodes, saveProfile as persistProfile } from '../data/storage'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Profile({ bp = 'mobile', onLogout }) {
  const { profile, updateProfile, episodes } = useStore()
  const toast = useToast()
  const fileRef = useRef(null)
  const [confirmImport, setConfirmImport] = useState(false)
  const [pendingImport, setPendingImport] = useState(null)

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
            <>
              <Segmented
                options={[{ value: 'natural', label: 'Naturel' }, { value: 'pill', label: 'Pilule' }]}
                value={profile.cycleMode || 'natural'}
                onChange={(v) => updateProfile({ cycleMode: v })}
              />
              {(profile.cycleMode || 'natural') === 'natural' ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <MiniField label="Duree cycle">
                    <input type="number" min={18} max={45} value={profile.cycleLength}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        if (v >= 18 && v <= 45) updateProfile({ cycleLength: v })
                      }}
                      style={inputStyle} /> j
                  </MiniField>
                  <MiniField label="Dernieres regles">
                    <input type="date" value={profile.lastPeriod} max={todayISO()}
                      onChange={(e) => {
                        if (e.target.value && e.target.value > todayISO()) return
                        updateProfile({ lastPeriod: e.target.value })
                      }}
                      style={{ ...inputStyle, width: '100%' }} />
                  </MiniField>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <MiniField label="Jours actifs">
                    <input type="number" min={1} max={28} value={profile.pillActiveDays || 21}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        if (v >= 1 && v <= 28) updateProfile({ pillActiveDays: v })
                      }}
                      style={inputStyle} /> j
                  </MiniField>
                  <MiniField label="Jours pause">
                    <input type="number" min={0} max={14} value={profile.pillBreakDays || 7}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        if (v >= 0 && v <= 14) updateProfile({ pillBreakDays: v })
                      }}
                      style={inputStyle} /> j
                  </MiniField>
                  <MiniField label="Debut plaquette">
                    <input type="date" value={profile.pillPackStart || ''} max={todayISO()}
                      onChange={(e) => {
                        if (e.target.value && e.target.value > todayISO()) return
                        updateProfile({ pillPackStart: e.target.value })
                      }}
                      style={{ ...inputStyle, width: '100%' }} />
                  </MiniField>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Label style={{ marginTop: 18 }}>Reperes personnels</Label>

      <div style={{ background: colors.sand.bg, borderRadius: radius.lg, padding: 15, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text.body, display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="ti ti-moon" aria-hidden="true" /> Reperes lunaires
            </div>
            <div style={{ fontSize: 12, color: colors.sand.text, marginTop: 4, lineHeight: 1.5 }}>
              Affiche la phase lunaire actuelle et le cycle des phases.
            </div>
          </div>
          <button onClick={() => updateProfile({ moonOn: !profile.moonOn })}
            aria-label="Activer les reperes lunaires"
            style={{ border: 'none', background: 'transparent', padding: 0, marginTop: 2 }}>
            <Toggle on={profile.moonOn} />
          </button>
        </div>
      </div>

      <div style={{ background: colors.sand.bg, borderRadius: radius.lg, padding: 15, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text.body, display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="ti ti-planet" aria-hidden="true" /> Reperes planetaires
            </div>
            <div style={{ fontSize: 12, color: colors.sand.text, marginTop: 4, lineHeight: 1.5 }}>
              Affiche les positions des planetes dans le systeme solaire.
            </div>
          </div>
          <button onClick={() => updateProfile({ planetsOn: !profile.planetsOn })}
            aria-label="Activer les reperes planetaires"
            style={{ border: 'none', background: 'transparent', padding: 0, marginTop: 2 }}>
            <Toggle on={profile.planetsOn} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: colors.amber.bg, borderRadius: radius.sm, padding: '8px 10px', marginBottom: 14 }}>
        <i className="ti ti-info-circle" style={{ color: colors.amber.text, fontSize: 15 }} aria-hidden="true" />
        <span style={{ fontSize: 11, color: colors.amber.text, lineHeight: 1.45 }}>
          Reperes personnels sans valeur medicale. N'apparaissent pas dans le rapport medecin.
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <p style={{ textAlign: 'center', fontSize: 12, color: colors.text.faint, marginTop: 6, marginBottom: 16 }}>
        Desactives par defaut {'\u00b7'} activables quand tu veux
      </p>

      <Label style={{ marginTop: 10 }}>Mes donnees</Label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button onClick={() => {
          const data = { version: 1, exportedAt: new Date().toISOString(), episodes, profile }
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `pousse-backup-${todayISO()}.json`
          a.click()
          URL.revokeObjectURL(url)
          toast('Sauvegarde exportee', 'success')
        }}
          style={{
            flex: 1, border: `1.5px solid ${colors.border.soft}`,
            background: 'transparent', color: colors.text.muted, padding: 11,
            borderRadius: radius.md, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
          <i className="ti ti-download" aria-hidden="true" /> Exporter
        </button>
        <button onClick={() => fileRef.current?.click()}
          style={{
            flex: 1, border: `1.5px solid ${colors.border.soft}`,
            background: 'transparent', color: colors.text.muted, padding: 11,
            borderRadius: radius.md, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
          <i className="ti ti-upload" aria-hidden="true" /> Importer
        </button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = (ev) => {
              try {
                const data = JSON.parse(ev.target.result)
                if (!data.episodes || !Array.isArray(data.episodes)) {
                  toast('Fichier invalide : aucun episode trouve', 'error')
                  return
                }
                setPendingImport(data)
                setConfirmImport(true)
              } catch {
                toast('Fichier invalide', 'error')
              }
            }
            reader.readAsText(file)
            e.target.value = ''
          }} />
      </div>
      <div style={{ fontSize: 11, color: colors.text.faint, marginBottom: 18, lineHeight: 1.5 }}>
        <i className="ti ti-shield-check" style={{ fontSize: 12, marginRight: 4 }} aria-hidden="true" />
        Tes donnees restent sur cet appareil. Exporte-les regulierement pour eviter toute perte.
      </div>

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

      <ConfirmDialog
        open={confirmImport}
        title="Importer des donnees ?"
        message={pendingImport ? `Ce fichier contient ${pendingImport.episodes.length} episode${pendingImport.episodes.length > 1 ? 's' : ''}. Tes donnees actuelles seront remplacees.` : ''}
        confirmLabel="Importer"
        onConfirm={() => {
          if (pendingImport) {
            try {
              replaceAllEpisodes(pendingImport.episodes)
              if (pendingImport.profile) persistProfile(pendingImport.profile)
              toast('Donnees importees. Rechargement...', 'success')
              setTimeout(() => window.location.reload(), 1000)
            } catch {
              toast('Erreur lors de l\'import', 'error')
            }
          }
          setConfirmImport(false)
          setPendingImport(null)
        }}
        onCancel={() => { setConfirmImport(false); setPendingImport(null) }}
        danger
      />
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
