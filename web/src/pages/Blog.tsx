import { blogPosts } from '../data/fixtures'
import { formatDate } from '../lib/format'

export function Blog() {
  return (
    <div className="page">
      <header className="page-head">
        <h1>Updates</h1>
        <p className="lede">
          Notes from the creator. Publishing and scheduling are not connected to
          a backend yet — these entries are sample content.
        </p>
      </header>

      <div className="post-list">
        {blogPosts.map((post) => (
          <article key={post.slug} className="post">
            <h2>{post.title}</h2>
            <p className="muted">{formatDate(post.published_on)}</p>
            <p>{post.excerpt}</p>
            <details>
              <summary>Read the update</summary>
              <p>{post.body}</p>
            </details>
          </article>
        ))}
      </div>
    </div>
  )
}
