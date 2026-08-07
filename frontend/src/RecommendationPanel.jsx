import { useEffect, useState } from 'react'
import api from './api'
import { Icon, PanelIcon } from './Illustrations'

const fmtINR = (n) => `₹${Number(n).toLocaleString('en-IN')}`

export default function RecommendationPanel() {
  const [recommendation, setRecommendation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/assistant/recommendation/')
      .then((response) => setRecommendation(response.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="panel">
        <h3 className="panel-head"><PanelIcon name="shield" /> AI loan recommendation</h3>
        <div className="app-empty">Analyzing your profile...</div>
      </section>
    )
  }

  if (!recommendation) {
    return (
      <section className="panel">
        <h3 className="panel-head"><PanelIcon name="shield" /> AI loan recommendation</h3>
        <div className="app-empty">Recommendation is unavailable right now.</div>
      </section>
    )
  }

  const reject = recommendation.reject
  const overburdened = recommendation.overburdened

  return (
    <section className={`panel recommendation-panel ${overburdened ? 'overburdened' : ''}`}>
      <h3 className="panel-head">
        <PanelIcon name={reject ? 'alert' : 'shield'} /> AI loan recommendation
        <span className={`pill ${reject ? 'role-admin' : overburdened ? 'role-bank' : 'role-user'}`}>
          <Icon name={reject ? 'cross' : 'check'} size={12} />
          {reject ? 'Not recommended' : overburdened ? 'Caution' : 'Good to apply'}
        </span>
      </h3>
      <div className="recommendation-body">
        <div className="recommendation-metric">
          <span className="recommendation-label">Recommended maximum loan amount</span>
          <strong className="recommendation-value">
            {reject ? 'Not eligible' : fmtINR(recommendation.recommended_max_amount)}
          </strong>
        </div>
        {!reject ? (
          <div className="recommendation-metric">
            <span className="recommendation-label">Suggested tenure</span>
            <strong className="recommendation-value">{recommendation.suggested_tenure_months} months</strong>
          </div>
        ) : null}
        <div className="recommendation-metric">
          <span className="recommendation-label">Active loans / total exposure</span>
          <strong className="recommendation-value">
            {recommendation.active_count} · {fmtINR(recommendation.total_exposure)}
          </strong>
        </div>
      </div>
      <p className="muted small recommendation-reason">{recommendation.reason}</p>
      {recommendation.existing_loans?.length ? (
        <div className="stack existing-loans">
          {recommendation.existing_loans.map((loan, index) => (
            <article className="mini-card" key={index}>
              <div className="row">
                <div>
                  <h4>{loan.purpose}</h4>
                  <p className="muted small">{loan.bank}</p>
                </div>
                <div className="row right">
                  <span className="muted small">{fmtINR(loan.amount)}</span>
                  <span className={`status-pill ${loan.status}`}>
                    <Icon name={loan.status === 'approved' ? 'check' : 'clock'} size={11} />
                    {loan.status}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted small">No active loans on your profile.</p>
      )}
    </section>
  )
}