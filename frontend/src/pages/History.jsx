import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/practice/history').then(r => { setHistory(r.data); setLoading(false) })
  }, [])

  const fmtTime = (s) => s >= 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s`
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.body}>
        <h1 style={S.title}>📋 Practice History</h1>
        <p style={S.sub}>Your last 20 practice attempts</p>

        {loading && <div style={{ display:'flex', justifyContent:'center', padding:'60px' }}><div className="spinner" /></div>}

        {!loading && history.length === 0 && (
          <div style={S.empty}>No attempts yet. Start practicing! 📚</div>
        )}

        {history.map((a, i) => (
          <div key={a.id} style={S.card} className="fade-up">
            <div style={S.cardTop}>
              <div>
                <span style={S.mode}>Practice</span>
                <span style={{ color: 'var(--text2)', fontSize: '13px', marginLeft: '12px' }}>{fmtDate(a.attempted_at)}</span>
              </div>
              <div style={{ ...S.score, color: a.score >= 75 ? 'var(--accent)' : a.score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                {a.score}%
              </div>
            </div>
            <div style={S.stats}>
              <Stat label="Correct" value={`${a.correct_answers}/${a.total_questions}`} />
              <Stat label="Time"    value={fmtTime(a.time_taken)} />
              <Stat label="Chapter" value={a.chapter_id ? `Ch ${a.chapter_id}` : 'All Chapters'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '16px', fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{label}</div>
    </div>
  )
}

const S = {
  page:  { minHeight: '100vh', background: 'var(--bg)' },
  body:  { maxWidth: '780px', margin: '0 auto', padding: '40px 24px' },
  title: { fontFamily: 'Syne,sans-serif', fontSize: '30px', marginBottom: '6px' },
  sub:   { color: 'var(--text2)', marginBottom: '28px' },
  empty: { textAlign: 'center', padding: '60px', color: 'var(--text2)' },
  card:  { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 24px', marginBottom: '12px' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  mode:  { background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 },
  score: { fontSize: '24px', fontFamily: 'Syne,sans-serif', fontWeight: 800 },
  stats: { display: 'flex', gap: '32px' },
}
