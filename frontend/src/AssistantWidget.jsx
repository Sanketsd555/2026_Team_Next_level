import { useEffect, useRef, useState } from 'react'
import api from './api'
import { Icon } from './Illustrations'

const SUGGESTIONS = [
  'What documents do I need?',
  'Am I eligible for a loan?',
  'EMI for ₹5,00,000 over 36 months',
  'What is the status of my application?',
]

function AssistantMessages({ messages, typing }) {
  const scrollRef = useRef(null)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typing])

  return (
    <div className="chat-messages" ref={scrollRef}>
      {messages.map((message) => (
        <div className={`chat-row ${message.role}`} key={message.id}>
          <div className="chat-bubble">
            <p className="chat-text">{message.text}</p>
            {message.sources?.length ? (
              <div className="chat-sources">
                {message.sources.map((source) => (
                  <span className="chat-source" key={`${message.id}-${source.title}`}>
                    <Icon name={source.type === 'ad' ? 'landmark' : 'sparkles'} size={11} />
                    {source.title}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}
      {typing ? (
        <div className="chat-row bot">
          <div className="chat-bubble typing">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  const send = async (text) => {
    const question = (text || input).trim()
    if (!question || busy) return
    setInput('')
    setMessages((current) => [...current, { id: Date.now(), role: 'user', text: question }])
    setBusy(true)
    try {
      const response = await api.post('/assistant/chat/', { message: question })
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: 'bot', text: response.data.reply, sources: response.data.sources },
      ])
    } catch {
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: 'bot', text: 'The assistant is unreachable right now. Please try again.' },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {open ? (
        <div className="assistant-widget">
          <div className="assistant-head">
            <div className="assistant-title">
              <span className="assistant-icon"><Icon name="sparkles" size={15} /></span>
              <div>
                <h4>LoanFlow Assistant</h4>
                <p>RAG · Ollama LLM</p>
              </div>
            </div>
            <button className="icon-button" onClick={() => setOpen(false)} aria-label="Close chat">
              <Icon name="close" size={16} />
            </button>
          </div>
          <AssistantMessages messages={messages} typing={busy} />
          {!messages.length ? (
            <div className="chat-suggestions">
              <p className="muted small">Try asking:</p>
              {SUGGESTIONS.map((suggestion) => (
                <button className="suggestion-chip" key={suggestion} onClick={() => send(suggestion)} disabled={busy}>
                  <Icon name="sparkles" size={12} />
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
          <form
            className="chat-input"
            onSubmit={(event) => {
              event.preventDefault()
              send()
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about loans, EMI, documents..."
              disabled={busy}
            />
            <button className="send-button" disabled={busy || !input.trim()} aria-label="Send">
              <Icon name="send" size={15} />
            </button>
          </form>
        </div>
      ) : null}
      {!open ? (
        <button className="assistant-fab" onClick={() => setOpen(true)} aria-label="Open AI assistant">
          <Icon name="chat" size={19} />
          <span>Ask AI</span>
        </button>
      ) : null}
    </>
  )
}