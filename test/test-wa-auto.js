// test-wa-auto.js
const { startWA, sendWhatsappNotif } = require("../services/whatsapp"); // sesuaikan path

async function main() {
    const sock = await startWA();

    // tunggu WA benar-benar connected sebelum kirim
    let connected = false;
    sock.ev.on("connection.update", ({ connection }) => {
        if (connection === "open") {
            console.log("✅ WA connected! Bisa kirim pesan sekarang");
            connected = true;
        }
    });

    // tunggu sebentar sampai koneksi open
    await new Promise(resolve => {
        const interval = setInterval(() => {
            if (connected) {
                clearInterval(interval);
                resolve();
            }
        }, 500);
    });

    // buat dummy order
    const order = {
        id: Math.floor(Math.random() * 1000),
        customerName: "Tes Bot",
        total: 75000,
        items: ["Batik A", "Batik B"]
    };

    // kirim pesan otomatis ke owner
    try {
        await sendWhatsappNotif(order);
        console.log("✅ Pesan order otomatis terkirim!");
    } catch (err) {
        console.error("❌ Gagal kirim pesan:", err);
    }

    process.exit(0); // selesai test
}

main();
