import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login }   = useAuth()
  const navigate    = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.access_token, data.name, data.role)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card} className="fade-up">
        <div style={styles.logo}>EES<span style={{ color: 'var(--accent)' }}>Quiz</span></div>
        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.sub}>Login to continue your preparation</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              placeholder="you@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login →'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent)' }}>Register</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' },
  card:  { width: '100%', maxWidth: '420px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '40px' },
  logo:  { fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '24px', marginBottom: '24px' },
  title: { fontSize: '26px', marginBottom: '6px' },
  sub:   { color: 'var(--text2)', fontSize: '14px', marginBottom: '28px' },
  error: { background: 'rgba(255,82,82,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', marginBottom: '20px' },
  form:  { display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', color: 'var(--text)', fontSize: '15px' },
  footer:{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text2)' },
}
