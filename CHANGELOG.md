# Changelog Sierte API (Bot WhatsApp RT)

Semua perubahan dan daftar fitur terbaru dari dokumentasi proyek ini akan dicatat dalam berkas ini.

## [v0.1.0-alpha] - Pengembangan Tahap Awal

Versi ini merupakan implementasi pondasi utama untuk sistem Bot Rukun Tetangga yang terhubung dengan layanan WhatsApp secara otomatis menggunakan _whatsapp-web.js_.

### **✨ Fitur Saat Ini (Available Features)**

- **Smart Group Authentication & Filtering**:
  - `Private Message Blocking`: Secara _default_ bot akan mengabaikan seluruh _direct message_ / japri dari siapapun untuk menjaga fungsionalitas murni di ranah publik (RT).
  - `Group Whitelist (ALLOWED_GROUPS)`: Fitur filter restriktif tambahan yang mana bot hanya akan merespon pada ID Grup yang telah diizinkan oleh sistem (bisa mendaftarkan banyak grup sekaligus).

- **Mention System Response**:
  - Bot tidak akan cerewet di dalam grup dan **HANYA** "bangun" beserta memberi jawaban jika akun bot tersebut di-_mention_ (\`@nama-bot\`) secara langsung oleh warga di dalam percakapan grup.

- **Human-like Chat Behavior Simulation**:
  - Fitur _Anti-Robot_ di mana saat bot di-_mention_, bot akan melakukan simulasi _behavior_ seperti manusia asli, dengan urutan:
    1. Memberi notifikasi centang biru (_Read_ / *sendSeen*).
    2. Status WhatsApp di atas layar akan berubah menjadi *"mengetik..."* (*sendStateTyping*).
    3. Random jeda waktu (1.5 detik - 3.0 detik) seolah-olah sedang mengetik kalimat.
    4. Pesan otomatis baru dikirimkan spesifik membalas (_reply_) chat warga tersebut.

- **Sistem _Login_ berbasis Console Terminal**:
  - `Terminal QR Code`: Fitur untuk memunculkan _QR Code Link_ untuk pertama kalinya (*pairing*) tidak perlu via frontend, melainkan akan langsung ter-_render_ secara grafis teks di dalam Terminal *Console* untuk kemudahan *Developer/Maintainer*.
  - `Session Persistence`: Setelah sukses ter-_scan_, Token WhatsApp Web tersimpan ke _memory host_ / komputer (`.wwebjs_auth`). Tidak perlu nge-_scan_ ulang setiap program Node.js kembali dinyalakan.

### **🔧 Perbaikan Internal**

- Refaktor `whatsapp.service.ts` untuk memisahkan logika `handleIncomingMessage`.
- Isolasi sistem dan memastikan tidak menabrak *promise unhandled rejection* pada saat sesi terputus.

---
_Dibuat untuk merekap jejak pengembangan dari awal agar mempermudah monitoring ke depan._
