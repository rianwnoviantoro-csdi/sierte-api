# Sierte API - Bot WhatsApp RT 🤖

Aplikasi ini adalah sebuah bot WhatsApp yang dirancang khusus untuk mempermudah manajemen dan pengurus Rukun Tetangga (RT). Bot ini sangat cocok digunakan di dalam grup WhatsApp warga untuk mengotomatisasi pengumuman dan pencatatan keuangan.

Sistem dibangun menggunakan *framework* [NestJS](https://nestjs.com/) dan terintegrasi langsung dengan WhatsApp (melalui *whatsapp-web.js*).

---

## 🌟 Fitur Utama

- **Broadcast Pengumuman**: Memudahkan pengurus RT untuk menyebarkan informasi dan pengumuman penting secara massal dan tersentralisasi ke seluruh warga.
- **Pencatatan Kas RT**: Fitur terintegrasi bagi bendahara untuk mencatat pemasukan (iuran warga) dan pengeluaran kas RT dengan akurat.
- **Laporan Kas Transparan**: Menyediakan rekapitulasi data keuangan kepada warga RT yang dapat diakses atau di-request sewaktu-waktu di dalam grup.
- **Auto-Reply Cerdas**: Mampu merespons otomatis setiap kali akun bot disebutkan (*mention*) di dalam grup WhatsApp RT yang sudah divalidasi.

## 🚀 Instalasi & Menjalankan Aplikasi

Pastikan Anda memiliki **Node.js**, **PostgreSQL**, dan _package manager_ pilihan (Yarn/NPM) terpasang di sistem.

```bash
# 1. Install semua dependensi
$ yarn install

# 2. Persiapkan Database (Pastikan DATABASE_URL sudah diset di berkas .env)
$ yarn db:generate
$ yarn db:push
$ yarn db:seed       # Opsional: untuk mengisi data master awal (roles & admin)

> **ℹ️ Akun Default (hasil Seeder):**
> - **Email:** `admin@example.com`
> - **Password:** `Password1!`

# 3. Jalankan aplikasi (development watch-mode)
$ yarn run start:dev

# Atau jalankan dalam mode production
$ yarn run start:prod
```

## 📱 Cara Sinkronisasi Kontak WhatsApp

Aplikasi ini menggunakan sistem _Local Authentication_:

1. Pertama kali aplikasi dijalankan (`yarn run start:dev`), sebuah *QR Code* akan langsung muncul di terminal (console).
2. Buka aplikasi WhatsApp dari handphone yang nomornya ingin Anda jadikan "Bot RT".
3. Masuk ke **Perangkat Taut (Linked Devices)**, lalu pindai (scan) *QR Code* di terminal.
4. Tunggu beberapa saat. Jika sudah muncul log `✅ WhatsApp Bot is ready and connected!`, artinya bot sudah aktif dan dapat menerima/mengirim pesan.
5. Sesi akan otomatis tersimpan dalam direktori `.wwebjs_auth/` di komputer server sehingga bot tidak perlu memindai ulang setiap kali server dinyalakan ulang.

## 🔐 Konfigurasi Keamanan (Security)

Secara default, bot ini dikonfigurasi agar:
- **Mengabaikan Pesan Pribadi (Japri / Private Message)**: Sistem ini memprioritaskan privasi. Bot tidak merespon jika ada warga yang nge-chat pribadi.
- **Merespons Mention Spesifik**: Bot hanya akan "bangun" dan membalas jika ada yang me-_mention_ akunnya langsung di dalam grup.
- **Validasi Terbatas**: Jika diinginkan, bot bisa di-_restrict_ hanya boleh merespons aktivitas di grup-grup RT tertentu yang ID-nya sudah didaftarkan (`ALLOWED_GROUPS`).

## 📝 Daftar Perubahan (Changelog)

Untuk melihat daftar riwayat pembaruan versi serta detail fitur-fitur teknis yang sudah terimplementasi, silakan baca berkas [CHANGELOG.md](./CHANGELOG.md).

---

Dibuat untuk memudahkan warga RT 🏘️
