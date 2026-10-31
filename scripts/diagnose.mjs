import { spawn } from 'child_process';
import WebSocket from 'ws';

async function main() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  try {
    const tabs = await fetch('http://127.0.0.1:9222/json/list').then(r => r.json());
    const tab = tabs.find(t => t.type === 'page');
    if (!tab) {
      console.log('No page tab');
      chrome.kill();
      return;
    }

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 4, method: 'Page.navigate', params: { url: 'https://www.miregalo.us/' } }));
    });

    ws.on('message', (d) => {
      const msg = JSON.parse(d.toString());
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        console.log(`[CONSOLE ${msg.params.type}]:`, text);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.log('[EXCEPTION]:', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
      }
    });

    await new Promise(r => setTimeout(r, 5000));
    ws.close();
    chrome.kill();
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}

main();
