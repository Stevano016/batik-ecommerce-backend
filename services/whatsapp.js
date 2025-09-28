const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");

let sock;

async function startWA() {
    const { state, saveCreds } = await useMultiFileAuthState("wa-session");

    // logger bungkam kompatibel
    const silentLogger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
        trace: () => {},
        child: function() { return this; } // wajib ada
    };

    sock = makeWASocket({
        auth: state,
        logger: silentLogger
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
        if(qr) {
            qrcode.generate(qr, { small: true });
            console.log("📱 Scan QR ini untuk login");
        }

        if(connection === "open") console.log("✅ WA connected!");
        if(connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(`⚠️ WA disconnected (reason: ${reason}), reconnecting in 5s...`);
            setTimeout(startWA, 5000);
        }
    });

    sock.ev.on("messages.upsert", (msg) => {
        console.log("📩 Pesan baru:", msg.messages?.[0]?.message?.conversation || msg);
    });

    return sock;
}

async function sendWhatsappNotif(order) {
    if (!sock) {
        console.error("❌ WhatsApp belum terkoneksi!");
        return;
    }

    const ownerNumber = "6281575817391@s.whatsapp.net";
    const message = `📦 Pesanan Baru!\n\nID: ${order.id}\nNama: ${order.customerName}\nTotal: Rp${order.total}\nBarang: ${order.items.join(", ")}\n\nSegera diproses ya Bos.`;

    try {
        await sock.sendMessage(ownerNumber, { text: message });
        console.log("✅ Notif WA terkirim");
    } catch (err) {
        console.error("❌ Gagal kirim WA:", err);
    }
}

module.exports = { startWA, sendWhatsappNotif };
