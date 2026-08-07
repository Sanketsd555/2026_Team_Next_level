import { useRef, useState } from 'react'
import api from './api'
import { Icon, PanelIcon } from './Illustrations'

const fmtPct = (value) => (value == null ? '—' : `${value}%`)

export default function DocumentVerification() {
  const fileInputRef = useRef(null)
  const [docType, setDocType] = useState('pan')
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const pickFile = (event) => {
    const file = event.target.files?.[0]
    setFileName(file ? file.name : '')
    setResult(null)
    setError('')
  }

  const verify = async (event) => {
    event.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Choose a document image first.')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    const form = new FormData()
    form.append('document_type', docType)
    form.append('document', file)
    try {
      const response = await api.post('/verify-document/', form)
      setResult(response.data)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not verify the document.')
    } finally {
      setBusy(false)
    }
  }

  const checks = result?.checks || []

  return (
    <section className="panel">
      <h3 className="panel-head"><PanelIcon name="doc" /> Document verification</h3>
      <form className="stack" onSubmit={verify}>
        <div className="verify-tabs">
          {['pan', 'aadhaar'].map((type) => (
            <button
              type="button"
              key={type}
              className={`verify-tab ${docType === type ? 'active' : ''}`}
              onClick={() => {
                setDocType(type)
                setResult(null)
                setError('')
              }}
            >
              <Icon name={type === 'pan' ? 'card' : 'shield'} size={14} />
              {type === 'pan' ? 'PAN card' : 'Aadhaar card'}
            </button>
          ))}
        </div>
        <label className="upload-box">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={pickFile}
            required
          />
          <span className="upload-icon"><Icon name="search" size={18} /></span>
          <strong>{fileName || 'Upload a document image'}</strong>
          <span className="muted small">OCR + AI will read and validate the number</span>
        </label>
        <button disabled={busy}>
          <Icon name="sparkles" size={14} />
          {busy ? 'Verifying...' : 'Verify document'}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
      </form>

      {result ? (
        <div className="verify-result">
          <div className={`verify-verdict ${result.verified ? 'approved' : 'rejected'}`}>
            <Icon name={result.verified ? 'check' : 'cross'} size={16} />
            <div>
              <strong>{result.verified ? 'Document verified' : 'Verification failed'}</strong>
              <span className="muted small">
                {result.extracted_number ? `Extracted: ${result.extracted_number}` : result.error}
              </span>
            </div>
          </div>
          <div className="verify-stats">
            <span className="stat-card">
              <span className="stat-ico blue"><Icon name="search" size={14} /></span>
              <strong>OCR confidence</strong>
              <span>{fmtPct(result.ocr_confidence)}</span>
            </span>
            <span className="stat-card">
              <span className="stat-ico violet"><Icon name="doc" size={14} /></span>
              <strong>Document type</strong>
              <span>{result.document_type?.toUpperCase()}</span>
            </span>
          </div>
          {checks.length ? (
            <div className="stack">
              {checks.map((check, index) => (
                <article className="mini-card check-line" key={index}>
                  <Icon name={check.passed ? 'check' : 'cross'} size={13} className={check.passed ? 'pass' : 'fail'} />
                  <div>
                    <h4>{check.name}</h4>
                    <p className="muted small">{check.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {result.ai_review ? (
            <p className="muted small ai-review"><Icon name="sparkles" size={12} /> AI review: {result.ai_review}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}