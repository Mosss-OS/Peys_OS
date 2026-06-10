import 'dotenv/config';
import { spawn } from 'child_process';
import { createServer } from 'http';

const port = process.env.PORT || 3002;

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(port, () => {
  console.log(`🚀 Starting Peys WhatsApp Bot on port ${port}...`);
  
  const bot = spawn('node', ['server/index.mjs'], {
    stdio: 'inherit',
    env: process.env
  });
  
  bot.on('exit', (code) => {
    console.log(`Bot exited with code ${code}`);
    process.exit(code);
  });
});
