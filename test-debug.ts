async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/debug/db');
    const data = await res.json();
    console.log('DB Debug:', data);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}
test();
