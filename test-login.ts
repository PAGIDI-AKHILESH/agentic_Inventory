async function testLogin() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@acme.com', password: 'password' }),
    });
    const data = await res.json();
    console.log('Login Result:', res.status, data);
  } catch (error) {
    console.error('Login Fetch error:', error);
  }
}
testLogin();
