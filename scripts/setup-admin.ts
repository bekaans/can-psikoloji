import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { parse } from 'dotenv';

if (existsSync('.env') && !process.argv.includes('--reset')) {
  console.error(
    'Kurulum mevcut. Yönetici parolasını yenilemek için npm run admin:setup -- --reset',
  );
  process.exit(1);
}
const current = existsSync('.env') ? parse(readFileSync('.env')) : {};
const password = randomBytes(18).toString('base64url');
const env = {
  PORT: '5184',
  HOST: '127.0.0.1',
  APP_ORIGIN: 'http://127.0.0.1:5184',
  DATA_DIR: './data',
  TRUST_PROXY: '0',
  ...current,
  SESSION_SECRET: randomBytes(48).toString('hex'),
  ADMIN_USERNAME: current.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD_HASH: await bcrypt.hash(password, 12),
};
writeFileSync(
  '.env',
  Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n') + '\n',
  { mode: 0o600 },
);
console.log(
  JSON.stringify({
    username: env.ADMIN_USERNAME,
    password,
    note: 'Parola yalnızca bu çıktıda gösterilir; .env içinde bcrypt özeti saklanır. Sunucuyu yeniden başlatın.',
  }),
);
