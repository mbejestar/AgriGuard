
import { useCallback, useEffect, useState } from 'react'

export default function CommunityPost({ post, token }) {
  const [comments, setComments] = useState([])
  const [likes, setLikes] = useState([])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [liking, setLiking] = useState(false)
  const [error, setError] = useState('')

  const endpoint = `/backend/api/community/posts/${post.id}`

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...options.headers
      }
    })

    console.log('Community API:', {
      method: options.method || 'GET',
      url: response.url,
      status: response.status
    })

    const raw = await response.text()
    let data = {}

    if (raw.trim()) {
      try {
        data = JSON.parse(raw.replace(/^\uFEFF/, ''))
      } catch {
        console.error('Non-JSON server response:', {
          url: response.url,
          status: response.status,
          preview: raw.slice(0, 300)
        })

        throw new Error(
          `${options.method || 'GET'} ${path} returned HTTP ${response.status}. Check the browser Console for the server response.`
        )
      }
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        data.details ||
        data.hint ||
        `Request failed (${response.status})`
      )
    }

    return data
  }, [token])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')

    const [commentResult, likeResult] = await Promise.allSettled([
      request(`${endpoint}/comments`),
      request(`${endpoint}/likes`)
    ])

    const failures = []

    if (commentResult.status === 'fulfilled') {
      setComments(
        Array.isArray(commentResult.value)
          ? commentResult.value
          : []
      )
    } else {
      failures.push(`Comments: ${commentResult.reason.message}`)
    }

    if (likeResult.status === 'fulfilled') {
      setLikes(
        Array.isArray(likeResult.value)
          ? likeResult.value
          : []
      )
    } else {
      failures.push(`Likes: ${likeResult.reason.message}`)
    }

    if (failures.length) {
      setError(failures.join(' | '))
    }

    setLoading(false)
  }, [endpoint, request])

  useEffect(() => {
    refresh()
  }, [refresh])

  const getUserId = () => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null

      const base64 = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')

      const padded = base64.padEnd(
        Math.ceil(base64.length / 4) * 4,
        '='
      )

      const payload = JSON.parse(atob(padded))
      return payload.sub || null
    } catch {
      return null
    }
  }

  async function addComment(event) {
    event.preventDefault()

    if (!comment.trim() || submitting) return

    setSubmitting(true)
    setError('')

    try {
      await request(`${endpoint}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: comment.trim()
        })
      })

      setComment('')
      await refresh()
    } catch (err) {
      setError(`Comment failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleLike() {
    if (liking || loading) return

    setLiking(true)
    setError('')

    try {
      const userId = getUserId()

      if (!userId) {
        throw new Error(
          'Could not identify your account. Please log in again.'
        )
      }

      const alreadyLiked = likes.some(
        (like) => like.user_id === userId
      )

      await request(`${endpoint}/like`, {
        method: alreadyLiked ? 'DELETE' : 'POST'
      })

      await refresh()
    } catch (err) {
      setError(`Like failed: ${err.message}`)
    } finally {
      setLiking(false)
    }
  }

  const currentUserId = getUserId()
  const likedByMe = likes.some(
    (like) => like.user_id === currentUserId
  )

  return (
    <article className="community-card">
      <div className="community-post-header">
        <strong>
          🌱 {post.author?.full_name || 'Farmer'}
        </strong>
        <span>
          {post.crop_name || 'General discussion'}
        </span>
      </div>

      <p className="community-post-content">
        {post.content}
      </p>

      <small>
        {post.created_at
          ? new Date(post.created_at).toLocaleString()
          : 'Date unavailable'}
      </small>

      <div className="community-interactions">
        <button
          type="button"
          onClick={toggleLike}
          disabled={liking || loading}
          aria-pressed={likedByMe}
        >
          {likedByMe ? '❤️ Liked' : '🤍 Like'} ({likes.length})
        </button>

        <span>
          💬 {comments.length} Comments
        </span>
      </div>

      <div className="community-comments">
        <h3>Comments</h3>

        {loading && <p>Loading interactions...</p>}

        {!loading && comments.length === 0 && (
          <p>No comments yet. Start the conversation!</p>
        )}

        {comments.map((item) => (
          <div
            className="community-comment"
            key={item.id}
          >
            <strong>
              {item.author?.full_name || 'Farmer'}
            </strong>

            <p>{item.content}</p>

            <small>
              {item.created_at
                ? new Date(item.created_at).toLocaleString()
                : ''}
            </small>
          </div>
        ))}

        <form onSubmit={addComment}>
          <textarea
            value={comment}
            onChange={(event) =>
              setComment(event.target.value)
            }
            placeholder="Write a helpful comment..."
            maxLength={1000}
            rows={2}
            required
          />

          <button
            type="submit"
            disabled={submitting || !comment.trim()}
          >
            {submitting ? 'Sending...' : 'Post Comment'}
          </button>
        </form>
      </div>

      {error && (
        <p className="community-error" role="alert">
          {error}
        </p>
      )}
    </article>
  )
}
