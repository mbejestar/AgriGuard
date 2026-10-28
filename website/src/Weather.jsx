
import { useEffect, useState } from 'react'

export default function Weather() {
  const [weather, setWeather] = useState(null)
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [crop, setCrop] = useState('maize')

  async function loadWeather(latitude, longitude, name) {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
        timezone: 'auto',
        forecast_days: '3'
      })

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params}`
      )

      if (!response.ok) throw new Error('Weather service unavailable')

      const data = await response.json()
      setWeather(data)
      setLocation(name)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setError('Location detection is not supported.')
      return
    }

    setError('')
    setLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        loadWeather(
          position.coords.latitude,
          position.coords.longitude,
          'Your current location'
        )
      },
      () => {
        setLoading(false)
        setError('Location unavailable. Please search for a town.')
      },
      { timeout: 12000 }
    )
  }

  async function searchTown(event) {
    event.preventDefault()
    const name = event.currentTarget.elements.town.value.trim()
    if (!name) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en`
      )
      if (!response.ok) throw new Error('Location search unavailable')

      const data = await response.json()
      if (!data.results?.length) throw new Error('Town not found')

      const place = data.results[0]
      await loadWeather(
        place.latitude,
        place.longitude,
        `${place.name}, ${place.country}`
      )
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  useEffect(() => {
    // Location is requested only when the farmer clicks the button.
  }, [])

  const current = weather?.current
  const daily = weather?.daily

  const alerts = []
  if (daily) {
    if (Math.max(...daily.temperature_2m_max) >= 35)
      alerts.push('High heat forecast: monitor crop water stress.')
    if (Math.min(...daily.temperature_2m_min) <= 2)
      alerts.push('Cold or frost risk: protect sensitive crops.')
    if (Math.max(...daily.precipitation_sum) >= 25)
      alerts.push('Heavy rainfall possible: check drainage and waterlogging.')
  }

  if (current?.relative_humidity_2m >= 85)
    alerts.push('High humidity: monitor leaves for possible fungal disease symptoms.')

  const guidance = {
    maize: 'Maize needs sufficient moisture, particularly during flowering. Monitor heat stress and avoid waterlogging.',
    potato: 'Potatoes generally favour cooler growing conditions. Warm, humid weather may increase some disease risks.',
    tomato: 'Tomatoes benefit from consistent watering and good airflow. Avoid prolonged wet foliage where possible.'
  }

  return (
    <div className="weather-page">
      <div className="welcome-section">
        <p className="eyebrow">AGRICULTURAL WEATHER</p>
        <h1>Weather & Crop Alerts</h1>
        <p>Local forecasts and practical guidance for your crops.</p>
      </div>

      <div className="weather-actions">
        <button type="button" onClick={detectLocation} disabled={loading}>
          Use My Location
        </button>

        <form onSubmit={searchTown}>
          <input name="town" placeholder="Enter town or city" required />
          <button type="submit" disabled={loading}>Search</button>
        </form>
      </div>

      {loading && <p role="status">Loading weather...</p>}
      {error && <p role="alert">{error}</p>}

      {current && (
        <>
          <section className="weather-card">
            <h2>{location}</h2>
            <div className="weather-stats">
              <article>
                <span>Temperature</span>
                <strong>{current.temperature_2m}°C</strong>
              </article>
              <article>
                <span>Humidity</span>
                <strong>{current.relative_humidity_2m}%</strong>
              </article>
              <article>
                <span>Rainfall</span>
                <strong>{current.precipitation} mm</strong>
              </article>
              <article>
                <span>Wind</span>
                <strong>{current.wind_speed_10m} km/h</strong>
              </article>
            </div>
          </section>

          <section className="weather-card">
            <h2>3-Day Forecast</h2>
            <div className="weather-stats">
              {daily?.time.map((date, index) => (
                <article key={date}>
                  <strong>{date}</strong>
                  <p>High: {daily.temperature_2m_max[index]}°C</p>
                  <p>Low: {daily.temperature_2m_min[index]}°C</p>
                  <p>Rain: {daily.precipitation_sum[index]} mm</p>
                </article>
              ))}
            </div>
          </section>

          <section className="weather-card">
            <h2>Crop Care Guidance</h2>
            <label htmlFor="weather-crop">Select your crop</label>
            <select
              id="weather-crop"
              value={crop}
              onChange={(event) => setCrop(event.target.value)}
            >
              <option value="maize">Maize</option>
              <option value="potato">Potato</option>
              <option value="tomato">Tomato</option>
            </select>
            <p>{guidance[crop]}</p>
          </section>

          <section className="weather-card">
            <h2>Weather Alerts</h2>
            {alerts.length ? (
              <ul>
                {alerts.map((alert) => <li key={alert}>{alert}</li>)}
              </ul>
            ) : (
              <p>No configured weather thresholds triggered in the current forecast.</p>
            )}
            <p className="weather-disclaimer">
              Advisory guidance only. Local field conditions may differ.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
