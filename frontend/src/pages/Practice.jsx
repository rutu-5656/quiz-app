import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'

const STEPS = { SELECT: 'select', QUIZ: 'quiz', RESULT: 'result' }

export default function Practice() {
  const [step, setStep]         = useState(STEPS.SELECT)
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [subjectId, setSubjectId] = useState(null)
  const [chapterId, setChapterId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers]     = useState({})   // { qId: 'A'|'B'|'C'|'D' }
  const [current, setCurrent]     = useState(0)
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [startTime, setStartTime] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/practice/subjects').then(r => setSubjects(r.data))
  }, [])

  const loadChapters = async (sid) => {
    setSubjectId(sid); setChapterId(null)
     const { data } = await api.get(`/practice/subjects/${sid}/chapters`)
    // const { data } = await api.get(`/practice/chapters/${sid}`)
    // setChapters(data)
  }

  const startQuiz = async () => {
    setLoading(true)
    const params = { subject_id: subjectId, count: 10 }
    if (chapterId) params.chapter_id = chapterId
    const { data } = await api.get('/practice/start', { params })
    setQuestions(data); setAnswers({}); setCurrent(0)
    setStartTime(Date.now()); setStep(STEPS.QUIZ)
    setLoading(false)
  }

  const submitQuiz = async () => {
    setLoading(true)
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    const payload = {
      subject_id: subjectId,
      chapter_id: chapterId || null,
      answers: questions.map(q => ({
        question_id:     q.id,
        selected_option: answers[q.id] || null,
      })),
      time_taken: timeTaken,
    }
    const { data } = await api.post('/practice/submit', payload)
    
    setResult(data); setStep(STEPS.RESULT)
    setLoading(false)
  }

  // ── SELECT SCREEN ──
  if (step === STEPS.SELECT) return (
    <div style={S.page}>
      <Navbar />
      <div style={S.body}>
        <h1 style={S.title}>📚 Practice Mode</h1>
        <p style={S.sub}>No timer — learn at your own pace</p>

        <div style={S.card}>
          <label style={S.label}>Select Subject</label>
          <div style={S.optionGrid}>
            {subjects.map(s => (
              <div key={s.id}
                style={{ ...S.option, ...(subjectId === s.id ? S.optionActive : {}) }}
                onClick={() => loadChapters(s.id)}>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{s.code} · Sem {s.semester}</div>
              </div>
            ))}
          </div>

          {chapters.length > 0 && (
            <>
              <label style={{ ...S.label, marginTop: '24px' }}>Select Chapter <span style={{ color: 'var(--text3)' }}>(optional — leave blank for all)</span></label>
              <div style={S.optionGrid}>
                <div
                  style={{ ...S.option, ...(chapterId === null ? S.optionActive : {}) }}
                  onClick={() => setChapterId(null)}>
                  All Chapters
                </div>
                {chapters.map(c => (
                  <div key={c.id}
                    style={{ ...S.option, ...(chapterId === c.id ? S.optionActive : {}) }}
                    onClick={() => setChapterId(c.id)}>
                    Ch {c.chapter_number}: {c.title}
                  </div>
                ))}
              </div>
            </>
          )}

          <button
            className="btn btn-primary"
            style={{ marginTop: '32px', padding: '14px 36px' }}
            onClick={startQuiz}
            disabled={!subjectId || loading}>
            {loading ? 'Loading...' : 'Start Quiz →'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── QUIZ SCREEN ──
  if (step === STEPS.QUIZ) {
    const q = questions[current]
    const opts = [
      { key: 'A', text: q.option_a },
      { key: 'B', text: q.option_b },
      { key: 'C', text: q.option_c },
      { key: 'D', text: q.option_d },
    ]
    const selected = answers[q.id]
    const progress = ((current + 1) / questions.length) * 100

    return (
      <div style={S.page}>
        <Navbar />
        <div style={S.body}>
          {/* Progress */}
          <div style={S.progressBar}>
            <div style={{ ...S.progressFill, width: `${progress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px' }}>
            <span style={{ color: 'var(--text2)', fontSize: '14px' }}>
              Question {current + 1} of {questions.length}
            </span>
            <span style={{ color: 'var(--text2)', fontSize: '14px' }}>
              Answered: {Object.keys(answers).length}
            </span>
          </div>

          <div style={S.card}>
            <p style={S.qText}>{q.question_text}</p>
            <div style={S.optsList}>
              {opts.map(o => (
                <div key={o.key}
                  style={{
                    ...S.optItem,
                    ...(selected === o.key ? S.optSelected : {}),
                  }}
                  onClick={() => setAnswers({ ...answers, [q.id]: o.key })}>
                  <span style={S.optKey}>{o.key}</span>
                  <span>{o.text}</span>
                </div>
              ))}
            </div>

            <div style={S.navRow}>
              <button className="btn btn-outline"
                disabled={current === 0}
                onClick={() => setCurrent(c => c - 1)}>← Prev</button>

              {current < questions.length - 1
                ? <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)}>Next →</button>
                : <button className="btn btn-primary" onClick={submitQuiz} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Quiz ✓'}
                  </button>
              }
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
          <div style={{ fontSize: '56px' }}>{result.score >= 75 ? '🎉' : result.score >= 50 ? '👍' : '📖'}</div>
          <h2 style={{ fontSize: '36px', margin: '12px 0 4px' }}>{result.score}%</h2>
          <p style={{ color: 'var(--text2)' }}>{result.correct_answers} / {result.total_questions} correct</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
          <button className="btn btn-primary" onClick={() => { setStep(STEPS.SELECT); setResult(null) }}>
            Practice Again
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/history')}>View History</button>
        </div>

        {/* Per-question review */}
        <h3 style={{ marginBottom: '16px', fontFamily: 'Syne,sans-serif' }}>Review Answers</h3>
        {result.details.map((d, i) => (
          <div key={i} style={{ ...S.reviewItem, borderLeft: `3px solid ${d.is_correct ? 'var(--accent)' : 'var(--danger)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text2)' }}>Q{i + 1}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: d.is_correct ? 'var(--accent)' : 'var(--danger)' }}>
                {d.is_correct ? '✓ Correct' : '✗ Wrong'}
              </span>
            </div>
            <p style={{ marginBottom: '10px' }}>{questions[i]?.question_text}</p>
            <div style={{ fontSize: '14px', color: 'var(--text2)' }}>
              Your answer: <strong style={{ color: d.is_correct ? 'var(--accent)' : 'var(--danger)' }}>{d.selected_option || 'Skipped'}</strong>
              {' · '}Correct: <strong style={{ color: 'var(--accent)' }}>{d.correct_option}</strong>
            </div>
            {d.explanation && <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text2)', fontStyle: 'italic' }}>{d.explanation}</p>}
          </div>
        ))}
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
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px' },
  label:{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' },
  optionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '10px' },
  option: { padding: '14px 18px', borderRadius: '12px', border: '1.5px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' },
  optionActive: { border: '1.5px solid var(--accent)', background: 'var(--accent-glow)', color: 'var(--accent)' },

  progressBar: { height: '4px', background: 'var(--border)', borderRadius: '2px', marginBottom: '12px', overflow: 'hidden' },
  progressFill:{ height: '100%', background: 'var(--accent)', borderRadius: '2px', transition: 'width 0.3s' },

  qText: { fontSize: '18px', fontWeight: 500, marginBottom: '24px', lineHeight: 1.6 },
  optsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  optItem: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderRadius: '12px', border: '1.5px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' },
  optSelected: { border: '1.5px solid var(--accent)', background: 'var(--accent-glow)' },
  optKey: { width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 },
  navRow: { display: 'flex', justifyContent: 'space-between', marginTop: '28px' },

  resultHero: { textAlign: 'center', padding: '40px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', marginBottom: '24px' },
  reviewItem: { background: 'var(--bg2)', borderRadius: '12px', padding: '18px 20px', marginBottom: '12px', paddingLeft: '20px' },
}
