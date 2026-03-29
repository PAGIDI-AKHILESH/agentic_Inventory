async function testRegisterApi() {
  const email = `api-test-${Date.now()}@example.com`;
  const payload = {
    firstName: 'API',
    lastName: 'Test',
    email,
    phoneNumber: '+1234567890',
    password: 'password123',
    companyName: 'API Test Corp',
    industry: 'Retail',
    revenue: 'Under $1M',
    isPhoneVerified: true,
    inventoryItems: [
      { sku: 'API-SKU-1', name: 'API Item 1', currentStock: 100 }
    ],
    integrations: {
      telegram: true,
      erpSystem: 'shopify'
    }
  };

  console.log('Testing registration API...');
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

testRegisterApi();
