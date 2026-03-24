import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location         = useLocation()
  const navigate         = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (path) => location.pathname === path

  return (
    <nav style={styles.nav}>
      <Link to="/dashboard" style={styles.logo}>
        EES<span style={{ color: 'var(--accent)' }}>Quiz</span>
      </Link>

      <div style={styles.links}>
        <Link to="/dashboard" style={{ ...styles.link, ...(isActive('/dashboard') ? styles.active : {}) }}>Home</Link>
        <Link to="/practice"  style={{ ...styles.link, ...(isActive('/practice')  ? styles.active : {}) }}>Practice</Link>
        <Link to="/compete"   style={{ ...styles.link, ...(isActive('/compete')   ? styles.active : {}) }}>Compete</Link>
        <Link to="/history"   style={{ ...styles.link, ...(isActive('/history')   ? styles.active : {}) }}>History</Link>
        {user?.role === 'admin' && (
          <Link to="/admin" style={{ ...styles.link, ...(isActive('/admin') ? styles.active : {}) }}>Admin</Link>
        )}
      </div>

      <div style={styles.right}>
        <span style={styles.pts}>⚡ {/* points shown on dashboard */}</span>
        <span style={styles.name}>{user?.name}</span>
        <button onClick={handleLogout} style={styles.logout}>Logout</button>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '0 32px',
    height:         '64px',
    background:     'var(--bg2)',
    borderBottom:   '1px solid var(--border)',
    position:       'sticky',
    top:            0,
    zIndex:         100,
  },
  logo: {
    fontFamily: 'Syne, sans-serif',
    fontWeight: 800,
    fontSize:   '22px',
    color:      'var(--text)',
  },
  links: { display: 'flex', gap: '4px' },
  link: {
    padding:      '6px 14px',
    borderRadius: '8px',
    fontSize:     '14px',
    fontWeight:   '500',
    color:        'var(--text2)',
    transition:   'all 0.2s',
  },
  active: {
    background: 'var(--accent-glow)',
    color:      'var(--accent)',
  },
  right: { display: 'flex', alignItems: 'center', gap: '16px' },
  name: { fontSize: '14px', color: 'var(--text2)', fontWeight: 500 },
  pts:  { fontSize: '14px', color: 'var(--accent)' },
  logout: {
    background:   'transparent',
    border:       '1px solid var(--border)',
    color:        'var(--text2)',
    padding:      '6px 14px',
    borderRadius: '8px',
    fontSize:     '13px',
    cursor:       'pointer',
    transition:   'all 0.2s',
  },
}
