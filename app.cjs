// cPanel "Setup Node.js App" (Passenger) başlangıç dosyası.
process.env.NODE_ENV = 'production';
import('./server-dist/index.mjs').catch((error) => {
  console.error(error);
  process.exit(1);
});
