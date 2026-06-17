import { useState, useRef, useEffect } from 'react';
import Layout from '../../components/Layout';
import { askAi } from '../../api/api';

const SUGGESTIONS = [
  'Explain Java OOP concepts',
  'What is Spring Boot and how does it work?',
  'Explain React hooks with examples',
  'What is JWT authentication?',
  'Explain REST API best practices',
];

export default function AiChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello. I am your BinaryStack AI assistant. Ask any technical question about Java, Spring Boot, React, databases, or software engineering.",
    },
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (query) => {
    const text = query || input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await askAi(text);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'An error occurred while generating a response. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">AI Assistant</h1>
        <p className="text-slate-600 mt-1">Powered by OpenRouter for technical learning support</p>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => sendMessage(s)}
            className="text-xs bg-white hover:bg-primary-50 text-slate-700 px-3 py-1.5 rounded-full transition-colors border border-slate-200">
            {s}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="card flex flex-col" style={{ height: '55vh' }}>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 border border-primary-200 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mr-2 mt-0.5">
                  AI
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-primary-700 text-white rounded-br-sm'
                    : 'bg-slate-50 text-slate-700 rounded-bl-sm border border-slate-200'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 border border-primary-200 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mr-2">AI</div>
              <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex gap-3">
          <textarea
            id="ai-input"
            rows={1}
            className="input-field flex-1 resize-none"
            placeholder="Ask a question... (Enter to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            id="ai-send-btn"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="btn-primary px-5 flex-shrink-0"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
