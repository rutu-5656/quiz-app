import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

const TABS = { STATS: 'stats', QUESTIONS: 'questions', USERS: 'users' }

export default function Admin() {
  const [tab, setTab]           = useState(TABS.STATS)
  const [stats, setStats]       = useState(null)
  const [users, setUsers]       = useState([])
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [questions, setQuestions] = useState([])
  const [subjectId, setSubjectId] = useState('')
  const [chapterId, setChapterId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editQ, setEditQ]       = useState(null)
  const [form, setForm]         = useState(emptyForm())
  const [msg, setMsg]           = useState('')

  function emptyForm() {
    return { chapter_id: '', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', explanation: '', difficulty: 'medium' }
  }

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data))
    api.get('/practice/subjects').then(r => setSubjects(r.data))
    api.get('/admin/users').then(r => setUsers(r.data))
  }, [])

  const loadChapters = async (sid) => {
    setSubjectId(sid); setChapterId(''); setQuestions([])
    const { data } = await api.get(`/practice/subjects/${sid}/chapters`)
    setChapters(data)
  }

  const loadQuestions = async (cid) => {
    setChapterId(cid)
    const { data } = await api.get('/admin/questions', { params: { chapter_id: cid } })
    setQuestions(data)
  }

  const handleSave = async () => {
    try {
      if (editQ) {
        await api.put(`/admin/questions/${editQ.id}`, form)
        setMsg('Question updated ✓')
      } else {
        await api.post('/admin/questions', { ...form, chapter_id: parseInt(chapterId) })
        setMsg('Question added ✓')
      }
      setShowForm(false); setEditQ(null); setForm(emptyForm())
      if (chapterId) loadQuestions(chapterId)
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return
    await api.delete(`/admin/questions/${id}`)
    loadQuestions(chapterId)
  }

  const openEdit = (q) => {
    setEditQ(q)
    setForm({
      chapter_id: q.chapter_id, question_text: q.question_text,
      option_a: q.option_a, option_b: q.option_b,
      option_c: q.option_c, option_d: q.option_d,
      correct_option: q.correct_option, explanation: q.explanation || '',
      difficulty: q.difficulty,
    })
    setShowForm(true)
  }

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.body}>
        <h1 style={S.title}>⚙️ Admin Panel</h1>

        {/* Tabs */}
        <div style={S.tabs}>
          {Object.entries(TABS).map(([k, v]) => (
            <button key={v}
              style={{ ...S.tab, ...(tab === v ? S.tabActive : {}) }}
              onClick={() => setTab(v)}>
              {k[0] + k.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {msg && <div style={S.msg} onClick={() => setMsg('')}>{msg} ✕</div>}

        {/* ── STATS TAB ── */}
        {tab === TABS.STATS && stats && (
          <div style={S.statsGrid}>
            {[
              { label: 'Total Users',     value: stats.total_users,     icon: '👤' },
              { label: 'Total Questions', value: stats.total_questions, icon: '❓' },
              { label: 'Total Attempts',  value: stats.total_attempts,  icon: '📝' },
              { label: 'Total Subjects',  value: stats.total_subjects,  icon: '📚' },
            ].map(s => (
              <div key={s.label} style={S.statCard}>
                <span style={{ fontSize: '32px' }}>{s.icon}</span>
                <div style={{ fontSize: '36px', fontFamily: 'Syne,sans-serif', fontWeight: 800, color: 'var(--accent)' }}>{s.value}</div>
                <div style={{ color: 'var(--text2)', fontSize: '14px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── QUESTIONS TAB ── */}
        {tab === TABS.QUESTIONS && (
          <div>
            {/* Filters */}
            <div style={S.filterRow}>
              <select style={S.select} value={subjectId} onChange={e => loadChapters(e.target.value)}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select style={S.select} value={chapterId} onChange={e => loadQuestions(e.target.value)} disabled={!chapters.length}>
                <option value="">Select Chapter</option>
                {chapters.map(c => <option key={c.id} value={c.id}>Ch {c.chapter_number}: {c.title}</option>)}
              </select>
              {chapterId && (
                <button className="btn btn-primary" style={{ padding: '10px 20px' }}
                  onClick={() => { setEditQ(null); setForm({ ...emptyForm(), chapter_id: chapterId }); setShowForm(true) }}>
                  + Add Question
                </button>
              )}
            </div>

            {/* Add/Edit form */}
            {showForm && (
              <div style={S.formCard}>
                <h3 style={{ marginBottom: '20px', fontFamily: 'Syne,sans-serif' }}>
                  {editQ ? 'Edit Question' : 'Add New Question'}
                </h3>
                <div style={S.formGrid}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Question Text</label>
                    <textarea style={{ ...S.input, height: '80px', resize: 'vertical' }}
                      value={form.question_text}
                      onChange={e => setForm({ ...form, question_text: e.target.value })} />
                  </div>
                  {['a','b','c','d'].map(k => (
                    <div key={k}>
                      <label style={S.label}>Option {k.toUpperCase()}</label>
                      <input style={S.input} value={form[`option_${k}`]}
                        onChange={e => setForm({ ...form, [`option_${k}`]: e.target.value })} />
                    </div>
                  ))}
                  <div>
                    <label style={S.label}>Correct Option</label>
                    <select style={S.input} value={form.correct_option}
                      onChange={e => setForm({ ...form, correct_option: e.target.value })}>
                      {['A','B','C','D'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Difficulty</label>
                    <select style={S.input} value={form.difficulty}
                      onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                      {['easy','medium','hard'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Explanation (optional)</label>
                    <textarea style={{ ...S.input, height: '60px', resize: 'vertical' }}
                      value={form.explanation}
                      onChange={e => setForm({ ...form, explanation: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button className="btn btn-primary" onClick={handleSave}>
                    {editQ ? 'Update' : 'Save'}
                  </button>
                  <button className="btn btn-outline" onClick={() => { setShowForm(false); setEditQ(null); setForm(emptyForm()) }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Questions list */}
            {questions.length > 0 && (
              <div>
                <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '12px' }}>
                  {questions.length} questions in this chapter
                </p>
                {questions.map((q, i) => (
                  <div key={q.id} style={S.qRow}>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: 'var(--text2)', fontSize: '13px', marginRight: '8px' }}>#{i+1}</span>
                      <span style={{ fontSize: '15px' }}>{q.question_text}</span>
                      <span style={{ ...S.diffTag, ...(q.difficulty === 'hard' ? { color: 'var(--danger)', borderColor: 'var(--danger)' } : q.difficulty === 'easy' ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : { color: 'var(--warning)', borderColor: 'var(--warning)' }) }}>
                        {q.difficulty}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => openEdit(q)}>Edit</button>
                      <button className="btn btn-danger"  style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => handleDelete(q.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === TABS.USERS && (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['ID','Name','Email','Role','Points','Attempts','Joined'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={S.tr}>
                    <td style={S.td}>{u.id}</td>
                    <td style={S.td}>{u.name}</td>
                    <td style={S.td}>{u.email}</td>
                    <td style={S.td}>
                      <span style={{ color: u.role === 'admin' ? 'var(--warning)' : 'var(--accent)', fontWeight: 600 }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={S.td}>⚡ {u.total_points}</td>
                    <td style={S.td}>{u.compete_attempts}</td>
                    <td style={S.td}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const S = {
  page:  { minHeight: '100vh', background: 'var(--bg)' },
  body:  { maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' },
  title: { fontFamily: 'Syne,sans-serif', fontSize: '30px', marginBottom: '24px' },

  tabs: { display: 'flex', gap: '8px', marginBottom: '28px' },
  tab:  { padding: '8px 20px', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  tabActive: { border: '1.5px solid var(--accent)', color: 'var(--accent)', background: 'var(--accent-glow)' },

  msg: { background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', cursor: 'pointer', fontSize: '14px' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' },
  statCard:  { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },

  filterRow: { display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' },
  select:    { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', fontSize: '14px', minWidth: '200px' },

  formCard:  { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', marginBottom: '24px' },
  formGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  label:     { display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
  input:     { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', fontSize: '14px' },

  qRow:     { display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 18px', marginBottom: '8px' },
  diffTag:  { display: 'inline-block', marginLeft: '10px', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, border: '1px solid', verticalAlign: 'middle' },

  tableWrap: { overflowX: 'auto' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' },
  td:        { padding: '14px 16px', fontSize: '14px', borderBottom: '1px solid var(--border)' },
  tr:        { transition: 'background 0.15s' },
}
