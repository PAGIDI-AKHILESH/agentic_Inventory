async function testSearch() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNTM1YTViNy1hYmY0LTQwNTUtYjNkZC02OWM4MzMwNDc5YzAiLCJ0ZW5hbnRJZCI6ImRlbW8tdGVuYW50LWlkIiwicm9sZSI6Im93bmVyIiwiaWF0IjoxNzczNzQzOTAxLCJleHAiOjE3NzM3NDU3MDF9.1_a-E8pWGR2lez-K3hft4xwnUtYtpntXdJnX6stcagU'; // Use the token from the previous test
  try {
    const res = await fetch('http://localhost:3000/api/search?q=item', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Search Result:', res.status, data);
  } catch (error) {
    console.error('Search Fetch error:', error);
  }
}
testSearch();
