// test-wa.js
const { startWA } = require("../services/whatsapp"); // sesuaikan path
const readline = require("readline");

async function main() {
    const sock = await startWA();

    let connected = false;

    // Tangani status koneksi
    sock.ev.on("connection.update", ({ connection }) => {
        if(connection === "open") {
            console.log("✅ WA connected! Bisa kirim pesan sekarang");
            connected = true;
        }
    });

    // Tangani pesan masuk agar jelas
    sock.ev.on("messages.upsert", (msg) => {
        const messages = msg.messages || [];
        messages.forEach(m => {
            let text = "";
            if (m.message?.conversation) text = m.message.conversation;
            else if (m.message?.extendedTextMessage?.text) text = m.message.extendedTextMessage.text;
            else text = JSON.stringify(m.message);
            console.log("📩 Pesan baru:", text);
        });
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.setPrompt("Ketik nomor tujuan (misal 6281575817391) atau 'exit': ");
    rl.prompt();

    let number = "";

    rl.on("line", async (line) => {
        if(line.toLowerCase() === "exit") {
            rl.close();
            process.exit(0);
        }

        if(!number) {
            // pertama kali input = nomor tujuan
            number = line.trim();
            console.log(`Nomor tujuan diset: ${number}`);
            rl.setPrompt("Ketik pesan yang ingin dikirim: ");
            rl.prompt();
            return;
        }

        if(!connected) {
            console.log("⚠️ Tunggu WA terhubung dulu sebelum kirim pesan");
            rl.prompt();
            return;
        }

        const message = line.trim();
        const ownerNumber = `${number}@s.whatsapp.net`;

        try {
            await sock.sendMessage(ownerNumber, { text: message });
            console.log("✅ Pesan terkirim ke", number);
        } catch (err) {
            console.error("❌ Gagal kirim WA:", err?.output?.statusCode, err?.message || err);
        }

        rl.prompt();
    });
}

main();
