import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

const STEPS = { LEADERBOARD: 'lb', SELECT: 'select', QUIZ: 'quiz', RESULT: 'result' }

export default function Compete() {
  const [step, setStep]         = useState(STEPS.LEADERBOARD)
  const [leaderboard, setLB]    = useState([])
  const [subjects, setSubjects] = useState([])
  const [subjectId, setSubjectId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent]   = useState(0)
  const [answers, setAnswers]   = useState([])   // array in order
  const [timeLeft, setTimeLeft] = useState(120)
  const [qTimer, setQTimer]     = useState(0)    // time spent on current q
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const timerRef  = useRef(null)
  const qTimerRef = useRef(null)
  const startRef  = useRef(null)

  useEffect(() => {
    api.get('/compete/leaderboard').then(r => setLB(r.data))
    api.get('/practice/subjects').then(r => setSubjects(r.data))
  }, [])

  // Global quiz timer
  useEffect(() => {
    if (step !== STEPS.QUIZ) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); submitQuiz(true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [step])

  // Per-question timer
  useEffect(() => {
    if (step !== STEPS.QUIZ) return
    setQTimer(0)
    qTimerRef.current = setInterval(() => setQTimer(t => t + 1), 1000)
    return () => clearInterval(qTimerRef.current)
  }, [current, step])

  const startQuiz = async () => {
    setLoading(true)
    const { data } = await api.get('/compete/start', { params: { subject_id: subjectId } })
    setQuestions(data.questions)
    setTimeLeft(data.time_limit)
    setAnswers(data.questions.map(q => ({ question_id: q.id, selected_option: null, time_spent: 0 })))
    setCurrent(0); startRef.current = Date.now()
    setStep(STEPS.QUIZ); setLoading(false)
  }

  const selectOption = (optKey) => {
    clearInterval(qTimerRef.current)
    const spent = qTimer
    setAnswers(prev => prev.map((a, i) =>
      i === current ? { ...a, selected_option: optKey, time_spent: spent } : a
    ))
    // Auto-advance after 600ms
    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(c => c + 1)
      } else {
        submitQuiz(false)
      }
    }, 600)
  }

  const submitQuiz = async (autoSubmit = false) => {
    clearInterval(timerRef.current); clearInterval(qTimerRef.current)
    setLoading(true)
    const timeTaken = Math.floor((Date.now() - startRef.current) / 1000)
    // For autoSubmit (time ran out), fill remaining with no answer
    const finalAnswers = autoSubmit
      ? answers.map((a, i) => i >= current ? { ...a, time_spent: qTimer } : a)
      : answers

    try {
      const { data } = await api.post('/compete/submit', {
        subject_id: subjectId,
        answers:    finalAnswers,
        time_taken: timeTaken,
      })
      setResult(data); setStep(STEPS.RESULT)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  // ── LEADERBOARD SCREEN ──
  if (step === STEPS.LEADERBOARD) return (
    <div style={S.page}>
      <Navbar />
      <div style={S.body}>
        <h1 style={S.title}>⚔️ Compete Mode</h1>
        <p style={S.sub}>Speed + Accuracy + Streak = Points</p>

        <div style={S.lbCard}>
          <h3 style={{ fontFamily: 'Syne,sans-serif', marginBottom: '20px' }}>🏆 Global Leaderboard</h3>
          {leaderboard.length === 0
            ? <p style={{ color: 'var(--text2)' }}>No attempts yet — be the first!</p>
            : leaderboard.slice(0, 10).map((r, i) => (
              <div key={i} style={{ ...S.lbRow, ...(i < 3 ? S.lbTop : {}) }}>
                <span style={S.rank}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${r.rank}`}
                </span>
                <span style={{ flex: 1, fontWeight: 600 }}>{r.name}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>⚡ {r.total_points}</span>
                <span style={{ color: 'var(--text2)', fontSize: '13px', marginLeft: '16px' }}>
                  🔥 {r.best_streak} streak
                </span>
              </div>
            ))
          }
        </div>

        <button className="btn btn-primary" style={{ padding: '14px 36px' }} onClick={() => setStep(STEPS.SELECT)}>
          Enter Arena →
        </button>
      </div>
    </div>
  )

  // ── SELECT SCREEN ──
  if (step === STEPS.SELECT) return (
    <div style={S.page}>
      <Navbar />
      <div style={S.body}>
        <h1 style={S.title}>⚔️ Choose Subject</h1>
        <div style={S.card}>
          <div style={S.optGrid}>
            {subjects.map(s => (
              <div key={s.id}
                style={{ ...S.opt, ...(subjectId === s.id ? S.optActive : {}) }}
                onClick={() => setSubjectId(s.id)}>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{s.code}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            <button className="btn btn-outline" onClick={() => setStep(STEPS.LEADERBOARD)}>← Back</button>
            <button className="btn btn-primary" disabled={!subjectId || loading} onClick={startQuiz}>
              {loading ? 'Loading...' : 'Start →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── QUIZ SCREEN ──
  if (step === STEPS.QUIZ) {
    const q        = questions[current]
    const selected = answers[current]?.selected_option
    const progress = ((current + 1) / questions.length) * 100
    const timerPct = (timeLeft / 120) * 100
    const opts = [
      { key: 'A', text: q.option_a },
      { key: 'B', text: q.option_b },
      { key: 'C', text: q.option_c },
      { key: 'D', text: q.option_d },
    ]

    return (
      <div style={S.page}>
        <Navbar />
        <div style={S.body}>
          {/* Top bar */}
          <div style={S.topBar}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>PROGRESS</div>
              <div style={S.progressBar}><div style={{ ...S.progressFill, width: `${progress}%` }} /></div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>
                {current + 1} / {questions.length}
              </div>
            </div>
            <div style={S.timerBox}>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px', textAlign: 'center' }}>TIME</div>
              <div style={{ ...S.timerNum, color: timeLeft <= 15 ? 'var(--danger)' : 'var(--accent)' }}>
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>
            <div style={S.qTimerBox}>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>THIS Q</div>
              <div style={{ fontSize: '22px', fontFamily: 'Syne,sans-serif', fontWeight: 700, color: qTimer <= 3 ? 'var(--accent)' : qTimer <= 6 ? 'var(--warning)' : 'var(--text)' }}>
                {qTimer}s
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text2)' }}>
                {qTimer <= 3 ? '+50 bonus' : qTimer <= 6 ? '+30 bonus' : qTimer <= 10 ? '+10 bonus' : 'no bonus'}
              </div>
            </div>
          </div>

          {/* Question */}
          <div style={S.card}>
            <p style={S.qText}>{q.question_text}</p>
            <div style={S.optsList}>
              {opts.map(o => (
                <div key={o.key}
                  style={{
                    ...S.optItem,
                    ...(selected === o.key ? S.optSelected : {}),
                    pointerEvents: selected ? 'none' : 'auto',
                    opacity: selected && selected !== o.key ? 0.5 : 1,
                  }}
                  onClick={() => !selected && selectOption(o.key)}>
                  <span style={S.optKey}>{o.key}</span>
                  <span>{o.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── RESULT SCREEN ──
  if (step === STEPS.RESULT && result) return (
    <div style={S.page}>
      <Navbar />
      <div style={S.body}>
        <div style={S.resultHero}>
          <h2 style={{ fontSize: '42px', fontFamily: 'Syne,sans-serif', color: 'var(--accent)' }}>
            ⚡ {result.total_points} pts
          </h2>
          <p style={{ color: 'var(--text2)', marginTop: '8px' }}>
            {result.correct_answers}/{result.total_questions} correct · 🔥 Best streak: {result.max_streak}
          </p>
          {result.your_rank && (
            <div style={S.rankBadge}>Your Rank: #{result.your_rank.rank}</div>
          )}
        </div>

        <h3 style={{ fontFamily: 'Syne,sans-serif', margin: '28px 0 16px' }}>🏆 Updated Leaderboard</h3>
        <div style={S.lbCard}>
          {result.leaderboard.map((r, i) => (
            <div key={i} style={{ ...S.lbRow, ...(i < 3 ? S.lbTop : {}) }}>
              <span style={S.rank}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${r.rank}`}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{r.name}</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>⚡ {r.total_points}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={() => { setStep(STEPS.LEADERBOARD); setResult(null) }}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  )

  return null
}

const S = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  body: { maxWidth: '780px', margin: '0 auto', padding: '40px 24px' },
  title:{ fontFamily: 'Syne,sans-serif', fontSize: '30px', marginBottom: '6px' },
  sub:  { color: 'var(--text2)', marginBottom: '28px' },

  lbCard: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px', marginBottom: '24px' },
  lbRow:  { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' },
  lbTop:  { },
  rank:   { fontSize: '20px', width: '36px' },

  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px' },
  optGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '10px' },
  opt: { padding: '14px 18px', borderRadius: '12px', border: '1.5px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' },
  optActive: { border: '1.5px solid var(--accent)', background: 'var(--accent-glow)', color: 'var(--accent)' },

  topBar: { display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '24px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 24px' },
  progressBar: { height: '6px', background: 'var(--border)', borderRadius: '3px', width: '240px', overflow: 'hidden' },
  progressFill:{ height: '100%', background: 'var(--accent)', transition: 'width 0.3s' },
  timerBox: { marginLeft: 'auto' },
  timerNum: { fontSize: '28px', fontFamily: 'Syne,sans-serif', fontWeight: 800, textAlign: 'center' },
  qTimerBox:{ textAlign: 'center' },

  qText: { fontSize: '18px', fontWeight: 500, marginBottom: '24px', lineHeight: 1.6 },
  optsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  optItem: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderRadius: '12px', border: '1.5px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s' },
  optSelected: { border: '1.5px solid var(--accent)', background: 'var(--accent-glow)' },
  optKey: { width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 },

  resultHero: { textAlign: 'center', padding: '40px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', marginBottom: '8px' },
  rankBadge: { display: 'inline-block', marginTop: '16px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '6px 20px', borderRadius: '20px', fontWeight: 700 },
}
