import { spawn } from 'child_process';
import WebSocket from 'ws';

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const proc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const res = await fetch('http://127.0.0.1:9222/json/list');
    const tabs = await res.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;
    if (!wsUrl) {
      console.log('No ws url');
      proc.kill();
      return;
    }

    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Log.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
      ws.send(JSON.stringify({
        id: 4,
        method: 'Page.navigate',
        params: { url: 'https://www.miregalo.us/' }
      }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE [', msg.params.type, ']:', msg.params.args.map(a => a.value || a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.log('EXCEPTION:', JSON.stringify(msg.params.exceptionDetails, null, 2));
      }
    });

    await new Promise(r => setTimeout(r, 6000));
    ws.close();
    proc.kill();
  } catch (err) {
    console.error(err);
    proc.kill();
  }
}

test();
