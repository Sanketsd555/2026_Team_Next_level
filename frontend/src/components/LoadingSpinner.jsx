export default function LoadingSpinner({ text = 'Loading...', size = 'default' }) {
  return (
    <div className="loading-overlay">
      <div className={`spinner ${size === 'lg' ? 'lg' : ''}`} />
      {text && <span>{text}</span>}
    </div>
  )
}
