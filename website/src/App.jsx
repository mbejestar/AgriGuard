import { useEffect, useState } from 'react'
import PlantScanner from './PlantScanner'
import './App.css'
import PlantGuide from './PlantGuide'
import Weather from './Weather'
import Community from './Community'

function App() {
  const [theme, setTheme] = useState(() => {
  return localStorage.getItem('agriguard_theme') || 'dark'
})

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('agriguard_theme', theme)
}, [theme])

function toggleTheme() {
  setTheme(current => current === 'dark' ? 'light' : 'dark')
}
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [activePage, setActivePage] = useState('scanner')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [token, setToken] = useState(
    () => sessionStorage.getItem('agriguard_access_token') || ''
  )

  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState('')

  async function handleLogin(event) {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/backend/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok || !data.access_token) {
        throw new Error(
          data.msg ||
          data.message ||
          data.error_description ||
          data.error ||
          'Login failed. Check your email and password.'
        )
      }

      sessionStorage.setItem(
        'agriguard_access_token',
        data.access_token
      )
      setToken(data.access_token)
      setPassword('')
      setMessage('Login successful. Welcome to Agriguard.')
    } catch (error) {
      setMessage(error.message || 'Could not connect to the backend.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(event) {
    event.preventDefault()
    setMessage('')
    if (password.length < 8) {
      setMessage('Password must contain at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/backend/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           email,
           password,
            first_name: firstName.trim(),
            last_name: lastName.trim() }),
      })
      const data = await response.json()
      if (!response.ok || data.error || data.error_description) {
        throw new Error(data.msg || data.message || data.error_description || data.error || 'Registration failed.')
      }
      setPassword('')
      setConfirmPassword('')
      setFirstName('')
      setLastName('')
      setAuthMode('login')
      setMessage('Account created. Check your email for a confirmation link if required, then sign in.')
    } catch (error) {
      setMessage(error.message || 'Could not create account.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setReports([])
      return
    }

    let cancelled = false

    async function loadReports() {
      setReportsLoading(true)
      setReportsError('')

      try {
        const response = await fetch('/backend/api/crop-reports', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (!response.ok || data.success === false) {
          throw new Error(
            data.message ||
            data.error ||
            'Could not load your crop reports.'
          )
        }

        const reportList = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.reports)
              ? data.reports
              : []

        if (!cancelled) {
          setReports(reportList)
        }
      } catch (error) {
        if (!cancelled) {
          setReportsError(
            error.message || 'Could not connect to the backend.'
          )
        }
      } finally {
        if (!cancelled) {
          setReportsLoading(false)
        }
      }
    }

    loadReports()

    return () => {
      cancelled = true
    }
  }, [token])

  function handleLogout() {
    sessionStorage.removeItem('agriguard_access_token')
    setToken('')
    setReports([])
    setMessage('You have logged out.')
  }

  function refreshReports() {
    // Changing the token is unnecessary; reload the current page data instead.
    window.location.reload()
  }

  if (token) {
    return (
      <main className="dashboard-page">
          <aside className="app-sidebar">
  <h2>🌱 Agriguard</h2><p className="sidebar-caption">Your crop health companion</p>

  <nav aria-label="Main navigation">
    <button
      type="button"
      onClick={() => setActivePage('scanner')}
      className={activePage === 'scanner' ? 'active' : ''}
    >
      📷 Scanner
    </button>

    <button
      type="button"
      onClick={() => setActivePage('care')}

      className={activePage === 'care' ? 'active' : ''}
    >
      📖 Care Guide
    </button>

    <button
      type="button"
      onClick={() => setActivePage('diagnose')}
      className={activePage === 'diagnose' ? 'active' : ''}
    >
      🌿 Diagnose
    </button>

    <button
      type="button"
      onClick={() => setActivePage('reports')}
      className={activePage === 'reports' ? 'active' : ''}
    >
      📋 Reports
    </button>
    <button
  type="button"
  onClick={() => setActivePage('weather')}
  className={activePage === 'weather' ? 'active' : ''}
>
  🌤️ Weather
</button>

<button
  type="button"
  onClick={() => setActivePage('community')}
  className={activePage === 'community' ? 'active' : ''}
>
  👥 Community
</button>
  </nav>
</aside>
        <div className="app-main">
        <header className="dashboard-header">
           <button
  type="button"
  className="theme-toggle"
  onClick={toggleTheme}
  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
>
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
</button>
          <a className="dashboard-brand" href="/" aria-label="Agriguard home">
            <span className="dashboard-logo">🌱</span>
            <span>Agri<span className="brand-accent">guard</span></span>
          </a>

          <button
            className="logout-button"
            type="button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </header>

       <section className="dashboard-content">
 {activePage === 'scanner' && (
  <>
    <div className="welcome-section">
      <p className="eyebrow">PLANT HEALTH ASSISTANT</p>
      <h1>Plant Scanner</h1>
      <p>Scan your crop to begin checking its health.</p>
    </div>

    <PlantScanner token={token} />
  </>
)}

{activePage === 'weather' && <Weather />}
{activePage === 'community' && <Community token={token} />}

{activePage === 'care' && <PlantGuide />}

{activePage === 'diagnose' && <PlantGuide />}

  {activePage === 'reports' && (<>
  <section className="summary-grid" aria-label="Report summary">
            <article className="summary-card">
              <span className="summary-icon">🌿</span>
              <p>Total crop reports</p>
              <strong>{reports.length}</strong>
            </article>

            <article className="summary-card">
              <span className="summary-icon">🔎</span>
              <p>Pending reports</p>
              <strong>
                {reports.filter(
                  (report) =>
                    !report.predicted_disease && String(report.status || '').toLowerCase() === 'pending'
                ).length}
              </strong>
            </article>

            <article className="summary-card">
              <span className="summary-icon">🛡️</span>
              <p>Connection</p>
              <strong className="connection-status">Connected</strong>
            </article>
          </section>

          <section className="reports-section">
            <div className="section-heading">
              <div>
                <h2>Your crop reports</h2>
                <p>Reports retrieved from your Agriguard database.</p>
              </div>

              <button
                className="refresh-button"
                type="button"
                onClick={refreshReports}
              >
                Refresh
              </button>
            </div>

            {reportsLoading && (
              <div className="empty-state">
                <p>Loading your crop reports...</p>
              </div>
            )}

            {!reportsLoading && reportsError && (
              <div className="error-state" role="alert">
                <p>{reportsError}</p>
                <p>
                  Check that your PHP backend is running and your login session
                  is still valid.
                </p>
              </div>
            )}

            {!reportsLoading && !reportsError && reports.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">🌱</span>
                <h3>No crop reports yet</h3>
                <p>
                  You are connected successfully, but no reports were returned
                  for this account.
                </p>
              </div>
            )}

            {!reportsLoading && !reportsError && reports.length > 0 && (
              <div className="reports-grid">
                {reports.map((report) => (
                  <article className="report-card" key={report.id}>
                    <div className="report-card-top">
                      <span className="crop-icon">🌾</span>
                      <span
                        className={`status-badge status-${String(
                          report.predicted_disease ? 'complete' : (report.status || 'unknown')
                        )
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '-')}`}
                      >
                        {report.predicted_disease ? 'Complete' : (report.status || 'Pending')}
                      </span>
                    </div>

                    <h3>{report.crop_name || 'Unnamed crop'}</h3>

                    <p className="report-disease">
                      <strong>Detected disease:</strong>{' '}
                      {report.predicted_disease || 'Not specified'}
                    </p>

                    {report.confidence !== null &&
                      report.confidence !== undefined && (
                        <p className="report-detail">
                          <strong>Confidence:</strong>{' '}
                          {`${Math.round(Number(report.confidence) * 100)}%`}
                        </p>
                      )}

                    {report.notes && (
                      <p className="report-notes">{report.notes}</p>
                    )}

                    <p className="report-date">
                      {report.created_at
                        ? new Date(report.created_at).toLocaleString()
                        : 'Date unavailable'}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

  </>)}
          <footer className="dashboard-footer">
            Agriguard · Protect your crops. Grow with confidence.
          </footer>
        </section>
        </div>
      </main>
    )
  }

  return (
    <main className="agriguard-page">
      <section className="login-card">
        <div className="brand-icon" aria-hidden="true">🌱</div>
        <p className="eyebrow">SMART AGRICULTURE</p>
        <h1>Agri<span>guard</span></h1>
        <p className="subtitle">
          Protect your crops. Understand plant health. Grow with confidence.
        </p>

        <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
          <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="form-description">
            {authMode === 'login' ? 'Sign in to your Agriguard account.' : 'Register to start tracking your crop health.'}
          </p>

           {authMode === 'register' && (
  <>
    <label htmlFor="first-name">First name</label>
    <input
      id="first-name"
      type="text"
      autoComplete="given-name"
      placeholder="Enter your first name"
      value={firstName}
      onChange={(event) => setFirstName(event.target.value)}
      maxLength={60}
      required
    />

    <label htmlFor="last-name">Last name</label>
    <input
      id="last-name"
      type="text"
      autoComplete="family-name"
      placeholder="Enter your last name"
      value={lastName}
      onChange={(event) => setLastName(event.target.value)}
      maxLength={60}
      required
    />
  </>
)}

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {authMode === 'register' && (
            <>
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
            </>
          )}
          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Create account'}
          </button>
          <p className="form-description">
            {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setMessage(''); setPassword(''); setConfirmPassword('') }}
              style={{ background: 'transparent', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>

        {message && (
          <p className="status-message" role="status">{message}</p>
        )}

        <footer>© 2026 Agriguard · Crop health starts here</footer>
      </section>
    </main>
  )
}

export default App
