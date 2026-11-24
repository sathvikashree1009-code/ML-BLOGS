import React, { useState } from 'react';
import api from '../api';

export default function Playground() {
  const [lang, setLang] = useState('js');
  const [code, setCode] = useState('console.log("Hello, world!");\nfor (let i = 0; i < 3; i++) console.log(i);');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setOutput('');
    if (lang === 'js') {
      try {
        const logs = [];
        const origLog = console.log;
        const sandbox = (fn) => { try { fn(); } catch (e) { logs.push('Error: ' + e.message); } };
        // capture via new Function with console override
        const f = new Function('console', code);
        const fakeConsole = { log: (...a) => logs.push(a.map(String).join(' ')), error: (...a) => logs.push('ERR: ' + a.join(' ')) };
        f(fakeConsole);
        setOutput(logs.join('\n') || '(no output)');
      } catch (e) {
        setOutput('Error: ' + e.message);
      } finally {
        setRunning(false);
      }
      return;
    }
    // python
    try {
      const { data } = await api.post('/run/python', { code });
      setOutput((data.output || '') + (data.error ? '\n' + data.error : ''));
    } catch (e) {
      setOutput('Error: ' + (e.response?.data?.message || e.message));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Code playground</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">Run JavaScript in-browser or Python via the backend (5s timeout).</p>
      <div className="flex gap-2">
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm">
          <option value="js">JavaScript</option>
          <option value="python">Python</option>
        </select>
        <button onClick={run} disabled={running} className="bg-blue-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition">
          {running ? 'Running...' : '▶ Run'}
        </button>
      </div>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={14} className="w-full font-mono text-sm bg-gray-900 text-gray-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40" spellCheck={false} />
      <div className="bg-gray-900 text-gray-100 rounded-xl p-4 font-mono text-sm min-h-[120px] whitespace-pre-wrap">
        {output || <span className="text-gray-500">Output will appear here...</span>}
      </div>
    </div>
  );
}