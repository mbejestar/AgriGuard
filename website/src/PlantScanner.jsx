import { useEffect, useRef, useState } from 'react'
import './PlantScanner.css'

const cropInfo = {
  Tomato: {
    latin: 'Solanum lycopersicum',
    water: 'Water deeply and consistently; avoid wetting foliage.',
    light: 'Full sun, approximately 6–8 hours daily.',
    temperature: 'Generally grows best around 18–27°C.',
    soil: 'Well-drained, fertile soil.',
    problems: ['Early blight', 'Late blight', 'Septoria leaf spot', 'Bacterial spot'],
  },
  Potato: {
    latin: 'Solanum tuberosum',
    water: 'Keep soil evenly moist; avoid waterlogging.',
    light: 'Full sun, approximately 6–8 hours daily.',
    temperature: 'Prefers cooler growing conditions, roughly 15–20°C.',
    soil: 'Loose, well-drained soil; hill soil around developing plants.',
    problems: ['Early blight', 'Late blight'],
  },
  'Corn (maize)': {
    latin: 'Zea mays',
    water: 'Provide consistent moisture, especially during flowering.',
    light: 'Full sun, approximately 6–8 hours daily.',
    temperature: 'Warm growing conditions, typically 18–30°C.',
    soil: 'Fertile, well-drained soil with adequate nutrients.',
    problems: ['Common rust', 'Northern leaf blight', 'Gray leaf spot'],
  },
}

function PlantScanner({ token }) {
  const cameraInput = useRef(null)
  const uploadInput = useRef(null)
  const [image, setImage] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('care')

  useEffect(() => {
    if (!image) { setImageUrl(''); return }
    const url = URL.createObjectURL(image)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  function handleImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please select a JPG, PNG or WebP image.'); return
    }
    if (!file.size || file.size > 5 * 1024 * 1024) {
      setError('Image must be between 1 byte and 5 MB.'); return
    }
    setError(''); setPrediction(null); setSaveMessage(''); setSaved(false)
    setTab('care'); setImage(file)
  }

  async function handleDiagnose() {
    if (!image || loading) return
    if (!token) { setError('Please sign in to diagnose a plant.'); return }
    setLoading(true); setError(''); setPrediction(null); setSaveMessage(''); setSaved(false)
    try {
      const body = new FormData()
      body.append('file', image)
      const response = await fetch('/backend/api/ai/predict', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || data.message || 'Diagnosis failed.')
      setPrediction(data)
    } catch (err) { setError(err.message || 'AI service unavailable.') }
    finally { setLoading(false) }
  }

  async function handleSave() {
    if (!prediction || !token || saving || saved) return
    setSaving(true); setError(''); setSaveMessage('')
    try {
      const response = await fetch('/backend/api/crop-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          crop_name: prediction.crop,
          predicted_disease: prediction.disease,
          confidence: prediction.confidence,
          notes: [prediction.note || 'Experimental AI prediction; not a confirmed diagnosis.',
            `AI model: ${prediction.model_version || 'agriguard-v1'}`].filter(Boolean).join(' | '),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || data.message || 'Unable to save report.')
      setSaved(true)
      setSaveMessage('Saved to your crop reports. Open Reports and click Refresh to see it.')
    } catch (err) { setError(err.message || 'Unable to save report.') }
    finally { setSaving(false) }
  }

  const info = prediction ? cropInfo[prediction.crop] : null
  const confidence = prediction ? Number(prediction.confidence) * 100 : 0

  return (
    <section className="ag-scan">
      <input ref={cameraInput} type="file" accept="image/jpeg,image/png,image/webp"
        capture="environment" onChange={handleImage} hidden aria-label="Take plant photo" />
      <input ref={uploadInput} type="file" accept="image/jpeg,image/png,image/webp"
        onChange={handleImage} hidden aria-label="Upload plant image" />

      {!prediction ? (
        <div className="ag-scan-panel">
          <span className="ag-kicker">AI PLANT HEALTH</span>
          <h2>Plant Disease Scanner</h2>
          <p>Photograph a maize, potato or tomato leaf to check for signs of disease.</p>
          <div className="ag-actions">
            <button type="button" disabled={loading} onClick={() => cameraInput.current?.click()}>Take Photo</button>
            <button type="button" disabled={loading} onClick={() => uploadInput.current?.click()}>Upload Image</button>
          </div>
          {imageUrl && <div className="ag-upload-preview">
            <img src={imageUrl} alt="Selected plant leaf" />
            <p>{image?.name}</p>
            <button className="ag-primary" type="button" disabled={loading} onClick={handleDiagnose}>
              {loading ? 'Analyzing leaf…' : 'Diagnose Plant'}
            </button>
          </div>}
        </div>
      ) : (
        <div className="ag-result-page">
          <div className="ag-photo-hero">
            {imageUrl && <img src={imageUrl} alt="Uploaded crop leaf" />}
            <button className="ag-back" type="button" onClick={() => { setPrediction(null); setSaveMessage(''); setSaved(false) }}>← New scan</button>
          </div>
          <div className="ag-result-content">
            <span className="ag-kicker">AI PLANT IDENTIFICATION</span>
            <h2>{prediction.crop}</h2>
            {info && <p className="ag-muted"><em>{info.latin}</em></p>}
            <div className="ag-diagnosis-card">
              <span>Predicted condition</span>
              <h3>{prediction.disease}</h3>
              <strong>{Number.isFinite(confidence) ? confidence.toFixed(2) : '—'}% model confidence</strong>
              <p>{prediction.note || 'Experimental AI prediction; not a confirmed diagnosis.'}</p>
            </div>
            <div className="ag-tabs" role="tablist" aria-label="Plant information">
              {[
                ['care', 'Care'], ['requirements', 'Requirements'],
                ['information', 'Information'], ['problems', 'Common problems'],
              ].map(([key, label]) => <button key={key} type="button" role="tab"
                aria-selected={tab === key} className={tab === key ? 'selected' : ''}
                onClick={() => setTab(key)}>{label}</button>)}
            </div>
            {tab === 'care' && <div className="ag-info-list">
              <h3>Care</h3>
              <article><span>💧</span><div><strong>Water</strong><p>{info?.water || 'Water according to crop needs.'}</p></div></article>
              <article><span>☀️</span><div><strong>Lighting</strong><p>{info?.light || 'Check crop sunlight requirements.'}</p></div></article>
              <article><span>🌱</span><div><strong>Soil</strong><p>{info?.soil || 'Use suitable, well-drained soil.'}</p></div></article>
            </div>}
            {tab === 'requirements' && <div className="ag-info-list">
              <h3>Plant requirements</h3>
              <article><span>🌡️</span><div><strong>Temperature</strong><p>{info?.temperature || 'Requirements depend on crop and variety.'}</p></div></article>
              <article><span>☀️</span><div><strong>Sunlight</strong><p>{info?.light || 'Check local growing recommendations.'}</p></div></article>
              <article><span>🌿</span><div><strong>Soil</strong><p>{info?.soil || 'Check local soil recommendations.'}</p></div></article>
            </div>}
            {tab === 'information' && <div className="ag-info-list">
              <h3>General information</h3>
              <article><span>🌿</span><div><strong>Crop</strong><p>{prediction.crop}</p></div></article>
              {info && <article><span>📖</span><div><strong>Scientific name</strong><p>{info.latin}</p></div></article>}
              <article><span>🔬</span><div><strong>Model</strong><p>{prediction.model_version || 'agriguard-v1'} · experimental</p></div></article>
            </div>}
            {tab === 'problems' && <div className="ag-info-list">
              <h3>Common problems</h3>
              <p className="ag-muted">Examples associated with this crop, not additional AI diagnoses.</p>
              {(info?.problems || [prediction.disease]).map(problem =>
                <article key={problem}><span>🍃</span><div><strong>{problem}</strong></div></article>)}
            </div>}
            {error && <p className="ag-error" role="alert">{error}</p>}
            {saveMessage && <p className="ag-success" role="status">{saveMessage}</p>}
            <button type="button" className="ag-save" disabled={saving || saved} onClick={handleSave}>
              {saving ? 'Saving…' : saved ? '✓ Saved to My Plants' : 'Save to My Plants'}
            </button>
          </div>
        </div>
      )}
      {!prediction && error && <p className="ag-error" role="alert">{error}</p>}
    </section>
  )
}

export default PlantScanner
