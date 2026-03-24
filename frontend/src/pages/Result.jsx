import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'

export default function Result() {
  const { attemptId } = useParams()
  const navigate      = useNavigate()
  const [result, setResult] = useState(null)

  useEffect(() => {
    api.get(`/compete/result/${attemptId}`).then(r => setResult(r.data))
  }, [attemptId])

  if (!result) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar />
      <div style={{ display:'flex', justifyContent:'center', paddingTop:'80px' }}><div className="spinner" /></div>
    </div>
  )

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.body}>
        <div style={S.hero}>
          <h2 style={{ fontSize: '42px', color: 'var(--accent)' }}>⚡ {result.compete_points} pts</h2>
          <p style={{ color: 'var(--text2)', marginTop: '8px' }}>
            {result.correct_answers}/{result.total_questions} correct · 🔥 Streak: {result.max_streak}
          </p>
        </div>

        <h3 style={{ fontFamily: 'Syne,sans-serif', margin: '28px 0 16px' }}>Answer Review</h3>
        {result.details.map((d, i) => (
          <div key={i} style={{ ...S.item, borderLeft: `3px solid ${d.is_correct ? 'var(--accent)' : 'var(--danger)'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
              <span style={{ fontSize:'13px', color:'var(--text2)' }}>Q{i+1} · {d.time_spent}s · {d.points_earned} pts</span>
              <span style={{ fontWeight:700, color: d.is_correct ? 'var(--accent)' : 'var(--danger)' }}>
                {d.is_correct ? '✓' : '✗'}
              </span>
            </div>
            <p style={{ marginBottom:'8px' }}>{d.question_text}</p>
            <div style={{ fontSize:'14px', color:'var(--text2)' }}>
              Your: <strong style={{ color: d.is_correct ? 'var(--accent)' : 'var(--danger)' }}>{d.selected_option || 'Skipped'}</strong>
              {' · '}Correct: <strong style={{ color:'var(--accent)' }}>{d.correct_option}</strong>
            </div>
            {d.explanation && <p style={{ marginTop:'8px', fontSize:'13px', color:'var(--text2)', fontStyle:'italic' }}>{d.explanation}</p>}
          </div>
        ))}

        <button className="btn btn-primary" style={{ marginTop:'20px' }} onClick={() => navigate('/compete')}>
          Back to Compete
        </button>
      </div>
    </div>
  )
}

const S = {
  page: { minHeight:'100vh', background:'var(--bg)' },
  body: { maxWidth:'780px', margin:'0 auto', padding:'40px 24px' },
  hero: { textAlign:'center', padding:'36px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'20px', marginBottom:'8px' },
  item: { background:'var(--bg2)', borderRadius:'12px', padding:'16px 20px', marginBottom:'10px' },
}
