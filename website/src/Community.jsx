import { useCallback, useEffect, useState } from 'react'
import CommunityPost from './CommunityPost'

export default function Community({ token }) {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [cropName, setCropName] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/backend/api/community/posts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const raw = await response.text()
      let data
      try { data = raw ? JSON.parse(raw.replace(/^\uFEFF/, '')) : {} }
      catch { throw new Error(`Invalid server response (${response.status})`) }

      if (!response.ok) {
        throw new Error(data.message || data.error || `Could not load posts (${response.status})`)
      }

      setPosts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  async function createPost(event) {
    event.preventDefault()

    if (!content.trim() || posting) return

    setPosting(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/backend/api/community/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content.trim(),
          crop_name: cropName || null
        })
      })

      const raw = await response.text()
      let data
      try { data = raw ? JSON.parse(raw.replace(/^\uFEFF/, '')) : {} }
      catch { throw new Error(`Invalid server response (${response.status})`) }

      if (!response.ok) {
        throw new Error(data.message || data.error || `Could not publish post (${response.status})`)
      }

      setContent('')
      setCropName('')
      setMessage('Your post was published successfully!')
      await loadPosts()
    } catch (err) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="community-page">
      <div className="welcome-section">
        <p className="eyebrow">AGRIGUARD FARMER NETWORK</p>
        <h1>Community Feed</h1>
        <p>
          Connect with farmers, share experiences and ask crop-related questions.
        </p>
      </div>

      <section className="community-card">
        <h2>Create a Post</h2>

        <form onSubmit={createPost}>
          <label htmlFor="community-crop">
            Crop category
          </label>

          <select
            id="community-crop"
            value={cropName}
            onChange={(event) => setCropName(event.target.value)}
          >
            <option value="">General discussion</option>
            <option value="Maize">Maize</option>
            <option value="Potato">Potato</option>
            <option value="Tomato">Tomato</option>
          </select>

          <label htmlFor="community-content">
            What would you like to share?
          </label>

          <textarea
            id="community-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Share a crop tip, ask a question, or describe a farming challenge..."
            maxLength={2000}
            rows={5}
            required
          />

          <p>{content.length}/2000 characters</p>

          <button
            type="submit"
            disabled={posting || !content.trim()}
          >
            {posting ? 'Publishing...' : 'Publish Post'}
          </button>
        </form>
      </section>

      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="community-success">
          {message}
        </p>
      )}

      <section className="community-feed">
        <div className="section-heading">
          <h2>Farmer Discussions</h2>

          <button
            type="button"
            onClick={loadPosts}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading && (
          <p>Loading community posts...</p>
        )}

        {!loading && posts.length === 0 && !error && (
          <div className="community-card">
            <h3>No posts yet</h3>
            <p>Be the first farmer to start a discussion!</p>
          </div>
        )}

        {!loading && posts.map((post) => (
          <CommunityPost
            key={post.id}
            post={post}
            token={token}
          />
        ))}
      </section>
    </div>
  )
}
