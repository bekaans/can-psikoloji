// cPanel "Setup Node.js App" (Passenger / LiteSpeed) başlangıç dosyası.
// Başlangıç hataları startup.log dosyasına yazılır (teşhis için).
process.env.NODE_ENV = 'production';
const fs = require('node:fs');
const path = require('node:path');
const log = (message) => {
  try {
    fs.appendFileSync(
      path.join(__dirname, 'startup.log'),
      `${new Date().toISOString()} ${message}\n`,
    );
  } catch {}
};
log(`başlıyor node ${process.version} cwd ${process.cwd()}`);
process.on('uncaughtException', (error) => {
  log(`uncaughtException ${(error && error.stack) || error}`);
  process.exit(1);
});
process.on('unhandledRejection', (error) => {
  log(`unhandledRejection ${(error && error.stack) || error}`);
  process.exit(1);
});
import('./server-dist/index.mjs').catch((error) => {
  log(`yükleme hatası ${(error && error.stack) || error}`);
  process.exit(1);
});
