fetch('https://ais-dev-sdtsguu52rwioe4l26mnxc-513498996197.asia-southeast1.run.app/api/webhooks/telegram', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
}).then(res => {
  console.log(res.status, res.statusText);
  console.log(res.headers.get('location'));
  return res.text();
}).then(console.log).catch(console.error);
