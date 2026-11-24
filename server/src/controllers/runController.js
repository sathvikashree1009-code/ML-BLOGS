const { spawn } = require('child_process');

exports.runPython = (req, res) => {
  const code = req.body.code || '';
  if (!code.trim()) return res.status(400).json({ message: 'code required' });
  const proc = spawn('python', ['-c', code], { timeout: 5000 });
  let stdout = '', stderr = '';
  const timer = setTimeout(() => { try { proc.kill(); } catch (e) {} }, 5000);
  proc.stdout.on('data', (d) => { stdout += d; });
  proc.stderr.on('data', (d) => { stderr += d; });
  proc.on('close', (code) => {
    clearTimeout(timer);
    res.json({ output: stdout, error: stderr, exitCode: code });
  });
  proc.on('error', (e) => {
    clearTimeout(timer);
    res.status(500).json({ error: e.message });
  });
};