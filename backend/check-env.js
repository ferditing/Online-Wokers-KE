require('dotenv').config();

console.log('Environment Variables Check:');
console.log('MPESA_ENV:', process.env.MPESA_ENV);
console.log('MPESA_CALLBACK_URL:', process.env.MPESA_CALLBACK_URL);
console.log('Consumer Key exists:', !!process.env.MPESA_CONSUMER_KEY);
console.log('Consumer Secret exists:', !!process.env.MPESA_CONSUMER_SECRET);
console.log('Shortcode exists:', !!process.env.MPESA_SHORTCODE);
console.log('Passkey exists:', !!process.env.MPESA_PASSKEY);
