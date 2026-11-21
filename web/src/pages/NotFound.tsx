import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="page page-narrow">
      <header className="page-head">
        <h1>Page not found</h1>
        <p className="lede">
          That route does not exist in this demonstration.
        </p>
      </header>
      <Link to="/" className="button">
        Back to the storefront
      </Link>
    </div>
  )
}
