const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const path = require('path');
const qrcode = require('qrcode-terminal'); // install dulu: npm i qrcode-terminal

let sock; // koneksi global WA

async function initWhatsApp() {
  const authPath = path.join(__dirname, '../whatsapp_auth');
  const { state, saveCreds } = await useMultiFileAuthState(authPath);

  sock = makeWASocket({
    auth: state
  });

  // Simpan kredensial kalau berubah
  sock.ev.on('creds.update', saveCreds);

  // 🔗 Tambahin listener koneksi di sini
  sock.ev.on('connection.update', (update) => {
    const { qr, connection } = update;

    if (qr) {
      console.log('🔗 Scan QR berikut untuk login WA:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp berhasil login');
    }

    if (connection === 'close') {
      console.log('❌ Koneksi WhatsApp terputus, coba cek lagi');
    }
  });

  // Log kalau ada pesan masuk (optional)
  sock.ev.on('messages.upsert', async (msg) => {
    console.log('Incoming message:', JSON.stringify(msg, null, 2));
  });

  console.log('✅ WhatsApp service initialized');
  return sock;
}

// Kirim pesan ke nomor
async function sendMessage(number, message) {
  if (!sock) {
    throw new Error('WhatsApp not initialized, call initWhatsApp() first');
  }

  const jid = number.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  await sock.sendMessage(jid, { text: message });
  console.log(`📩 WA sent to ${number}: ${message}`);
}

module.exports = {
  initWhatsApp,
  sendMessage
};
