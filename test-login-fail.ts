async function testLoginFail() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@test.com', password: 'password' }),
    });
    const data = await res.json();
    console.log('Login Fail Result:', res.status, data);
  } catch (error) {
    console.error('Login Fail Fetch error:', error);
  }
}
testLoginFail();
