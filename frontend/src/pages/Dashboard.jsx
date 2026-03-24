import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Dashboard() {
  const { user }       = useAuth()
  const navigate       = useNavigate()
  const [me, setMe]    = useState(null)

  useEffect(() => {
    api.get('/auth/me').then(r => setMe(r.data)).catch(() => {})
  }, [])

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.body}>

        {/* Hero */}
        <div style={styles.hero} className="fade-up">
          <div>
            <p style={styles.greeting}>Welcome back,</p>
            <h1 style={styles.name}>{user?.name} 👋</h1>
            <p style={styles.sub}>Environmental Education & Sustainability — Sem 4, K Scheme</p>
          </div>
          {me && (
            <div style={styles.pointsBadge}>
              <span style={styles.pointsNum}>⚡ {me.total_points}</span>
              <span style={styles.pointsLabel}>Total Points</span>
            </div>
          )}
        </div>

        {/* Mode cards */}
        <div style={styles.grid}>
          <ModeCard
            icon="📚"
            title="Practice"
            desc="Learn at your own pace. No timer, no pressure. Get instant feedback after every answer."
            tag="No Time Limit"
            tagColor="var(--accent)"
            onClick={() => navigate('/practice')}
            btnLabel="Start Practice"
          />
          <ModeCard
            icon="⚔️"
            title="Compete"
            desc="Race against the clock. Earn points based on speed & accuracy. Climb the leaderboard."
            tag="Speed Bonus + Streak"
            tagColor="var(--warning)"
            onClick={() => navigate('/compete')}
            btnLabel="Enter Arena"
            highlight
          />
        </div>

        {/* Quick info */}
        <div style={styles.infoRow}>
          <InfoTile icon="📖" label="Subject" value="EES — 314316" />
          <InfoTile icon="🏫" label="Semester" value="4 · K Scheme" />
          <InfoTile icon="❓" label="Questions" value="135 MCQs" />
          <InfoTile icon="📂" label="Chapters" value="3 Chapters" />
        </div>

      </div>
    </div>
  )
}

function ModeCard({ icon, title, desc, tag, tagColor, onClick, btnLabel, highlight }) {
  return (
    <div style={{ ...styles.modeCard, ...(highlight ? styles.modeCardHL : {}) }} className="fade-up">
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>{icon}</div>
      <span style={{ ...styles.tag, color: tagColor, borderColor: tagColor, background: tagColor + '18' }}>{tag}</span>
      <h2 style={{ fontSize: '26px', margin: '14px 0 10px' }}>{title}</h2>
      <p style={{ color: 'var(--text2)', fontSize: '15px', lineHeight: 1.7, flexGrow: 1 }}>{desc}</p>
      <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={onClick}>
        {btnLabel} →
      </button>
    </div>
  )
}

function InfoTile({ icon, label, value }) {
  return (
    <div style={styles.tile}>
      <span style={{ fontSize: '22px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '2px' }}>{value}</div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  body: { maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' },

  hero: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '20px', padding: '36px 40px', marginBottom: '28px',
  },
  greeting: { color: 'var(--text2)', fontSize: '15px', marginBottom: '4px' },
  name:     { fontSize: '36px', fontFamily: 'Syne,sans-serif', fontWeight: 800 },
  sub:      { color: 'var(--text2)', marginTop: '8px', fontSize: '14px' },
  pointsBadge: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    background: 'var(--accent-glow)', border: '1px solid var(--accent)',
    borderRadius: '16px', padding: '20px 32px',
  },
  pointsNum:   { fontSize: '32px', fontFamily: 'Syne,sans-serif', fontWeight: 800, color: 'var(--accent)' },
  pointsLabel: { fontSize: '12px', color: 'var(--text2)', marginTop: '4px', fontWeight: 600 },

  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  modeCard: {
    display: 'flex', flexDirection: 'column',
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '20px', padding: '32px',
  },
  modeCardHL: { border: '1px solid rgba(0,230,118,0.3)', background: 'rgba(0,230,118,0.04)' },
  tag: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid', letterSpacing: '0.3px' },

  infoRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' },
  tile: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '18px 20px',
  },
}
