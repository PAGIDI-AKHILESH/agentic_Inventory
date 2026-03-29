fetch('https://ais-pre-sdtsguu52rwioe4l26mnxc-513498996197.asia-southeast1.run.app/api/webhooks/telegram', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
}).then(res => {
  console.log(res.status, res.statusText);
  return res.text();
}).then(text => console.log(text.substring(0, 200))).catch(console.error);
