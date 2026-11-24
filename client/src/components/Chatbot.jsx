import React, { useState, useRef, useEffect } from 'react';
import api from '../api';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'bot', text: "Hi! I'm the ML Blogs assistant. Ask me anything. 👋" }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/chat', { message: text });
      setMessages((m) => [...m, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Network error. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-blue-500 text-white text-xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition flex items-center justify-center"
        aria-label="Chat"
      >💬</button>
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[22rem] h-[28rem] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950">
            <div>
              <div className="font-semibold text-sm">ML Blogs Assistant</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Ask about features or dev topics</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-gray-400 text-xs px-2">typing…</div>}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2 bg-gray-50 dark:bg-gray-950">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask something..."
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <button onClick={send} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition">Send</button>
          </div>
        </div>
      )}
    </>
  );
}