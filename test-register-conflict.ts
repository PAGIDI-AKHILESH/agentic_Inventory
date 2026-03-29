async function testRegisterConflict() {
  const payload = {
    firstName: 'Conflict',
    lastName: 'Test',
    email: 'admin@acme.com', // Already exists from seed
    phoneNumber: '+1234567890',
    password: 'password123',
    companyName: 'Conflict Corp',
    industry: 'Retail',
    revenue: 'Under $1M',
    isPhoneVerified: true,
    inventoryItems: [],
    integrations: {}
  };

  console.log('Testing registration conflict...');
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testRegisterConflict();
