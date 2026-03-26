# Sierte API - Bot WhatsApp RT 🤖

Aplikasi ini adalah sebuah bot WhatsApp yang dirancang khusus untuk mempermudah manajemen dan pengurus Rukun Tetangga (RT). Bot ini sangat cocok digunakan di dalam grup WhatsApp warga untuk mengotomatisasi pengumuman dan pencatatan keuangan.

Sistem dibangun menggunakan *framework* [NestJS](https://nestjs.com/) dengan database **PostgreSQL** via **Drizzle ORM**, dan terintegrasi langsung dengan WhatsApp (melalui *whatsapp-web.js*).

---

## 🌟 Fitur Utama

- **Broadcast Pengumuman**: Memudahkan pengurus RT untuk menyebarkan informasi dan pengumuman penting secara massal dan tersentralisasi ke seluruh warga.
- **Pencatatan Kas RT**: Fitur terintegrasi bagi bendahara untuk mencatat iuran warga langsung melalui perintah di grup WhatsApp.
- **Laporan Kas Transparan**: Menyediakan rekapitulasi data keuangan kepada warga RT yang dapat diakses atau di-request sewaktu-waktu di dalam grup.
- **Auto-Reply Cerdas**: Mampu merespons otomatis setiap kali akun bot disebutkan (*mention*) di dalam grup WhatsApp RT yang sudah divalidasi.
- **Autentikasi & Otorisasi**: Sistem login berbasis JWT dengan refresh token, perlindungan brute-force, dan role-based access control (RBAC).

---

## 🚀 Instalasi & Menjalankan Aplikasi

Pastikan Anda memiliki **Node.js**, **PostgreSQL**, dan _package manager_ pilihan (Yarn/NPM) terpasang di sistem.

```bash
# 1. Install semua dependensi
$ yarn install

# 2. Persiapkan Database (Pastikan DATABASE_URL sudah diset di berkas .env)
$ yarn db:generate
$ yarn db:push
$ yarn db:seed       # Mengisi data master awal (roles & admin default)
```

> **ℹ️ Akun Default (hasil Seeder):**
> - **Email:** `admin@example.com`
> - **Password:** `Password1!`
> - **Role:** `Super Admin` _(bypass semua role restriction)_

```bash
# 3. Jalankan aplikasi (development watch-mode)
$ yarn run start:dev

# Atau jalankan dalam mode production
$ yarn run start:prod
```

---

## 🔑 Auth API

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/auth/login` | ❌ | Login, mendapatkan `accessToken` & `refreshToken` |
| `POST` | `/auth/refresh` | ❌ | Perbarui `accessToken` menggunakan `refreshToken` |
| `POST` | `/auth/logout` | ✅ Bearer | Invalidasi session (hapus refresh token) |

**Request body login:**
```json
{
  "email": "admin@example.com",
  "password": "Password1!"
}
```

**Keamanan login:**
- Gagal login **5x berturut-turut** → akun dikunci otomatis
- Akun terkunci hanya bisa dibuka oleh administrator

---

## 🤖 Perintah Bot WhatsApp

Bot hanya aktif di dalam **grup yang terdaftar** dan hanya merespons ketika di-**mention** langsung.

### 💰 Catat Iuran Kas RT

Gunakan perintah berikut untuk menyimpan pembayaran iuran kas RT langsung dari grup WhatsApp:

```
@NamaBot kas [Nama] [Jumlah] [Keterangan]
```

| Parameter | Keterangan | Contoh |
|---|---|---|
| `Nama` | Nama anggota yang membayar | `Budi` |
| `Jumlah` | Nominal iuran (angka, tanpa titik/koma) | `50000` |
| `Keterangan` | Bulan atau catatan tambahan (opsional) | `Januari` |

**Contoh pesan:**
```
@NamaBot kas Budi 50000 Januari
```

**Respon berhasil:**
```
✅ Iuran Kas RT Berhasil Disimpan

Nama: Budi
Jumlah: Rp 50.000,00
Keterangan: Januari
```

> **Catatan:** Perintah juga mendukung varian `bayar kas`. Misalnya: `@NamaBot bayar kas Siti 100000 Februari`

### 📊 Laporan Kas RT

Untuk melihat rekapitulasi iuran kas pada periode tertentu:

```
@NamaBot laporan kas [Periode]
```

| Periode | Penjelasan | Contoh Format |
|---|---|---|
| `hari ini` | Laporan transaksi kas hari ini | `@NamaBot laporan kas hari ini` |
| `minggu ini` | Laporan transaksi kas dari awal minggu (Senin) hingga ujung minggu (Minggu) | `@NamaBot laporan kas minggu ini` |
| `bulan ini` | Laporan transaksi sepanjang bulan berjalan saat ini | `@NamaBot laporan kas bulan ini` |
| `YYYY-MM-DD` | Laporan transaksi pada tanggal spesifik | `@NamaBot laporan kas 2026-03-26` |

**Respon berhasil:**
```
📊 *Laporan Kas RT*
Periode: BULAN INI

1. 02/03/26 - Budi: Rp 50.000,00 (Januari)
2. 10/03/26 - Siti: Rp 100.000,00 (Feb-Mar)

*Total Pemasukan:* Rp 150.000,00
```

---

## 🗄️ Skema Database

| Tabel | Deskripsi |
|---|---|
| `users` | Data pengguna aplikasi (admin/pengurus RT) |
| `roles` | Daftar peran (Super Admin, Admin, dll.) |
| `user_roles` | Relasi many-to-many antara user dan role |
| `kas_rt` | Rekaman transaksi iuran kas RT (`source`: `bot` = dari WhatsApp, `api` = dari endpoint) |

---

## 🏗️ Arsitektur

```
src/
├── common/
│   ├── decorators/       @Roles() decorator
│   ├── filters/          HttpExceptionFilter (global)
│   ├── guards/           RolesGuard
│   ├── interceptors/     ResponseInterceptor (global)
│   └── pipes/            ZodValidationPipe (global, per-route)
├── config/               Env schema & app config
├── database/
│   ├── schema/           Drizzle table definitions (1 file per table)
│   └── seeds/            Database seeders
└── modules/
    ├── auth/             Login, logout, refresh token
    ├── database/         DatabaseModule & provider
    └── whatsapp/         WhatsApp bot integration & command handler
```

**Global providers** (terdaftar di `app.module.ts`):
| Layer | Class | Fungsi |
|---|---|---|
| Pipe | `ZodValidationPipe` | Validasi request body (pass-through jika tidak ada schema) |
| Filter | `HttpExceptionFilter` | Format error response |
| Interceptor | `ResponseInterceptor` | Format success response |

**Database scripts:**
```bash
yarn db:generate   # Generate file migrasi dari perubahan schema
yarn db:migrate    # Jalankan migrasi
yarn db:push       # Push schema langsung ke DB (dev only)
yarn db:seed       # Isi data awal
yarn db:studio     # Buka Drizzle Studio (visual DB manager)
```

---

## 📱 Cara Sinkronisasi Kontak WhatsApp

1. Pertama kali aplikasi dijalankan, sebuah *QR Code* akan langsung muncul di terminal.
2. Buka WhatsApp → **Perangkat Taut (Linked Devices)** → pindai QR Code.
3. Tunggu hingga muncul log `✅ WhatsApp Bot is ready and connected!`.
4. Sesi tersimpan otomatis di `.wwebjs_auth/` — tidak perlu scan ulang setiap restart.

---

## 📝 Daftar Perubahan (Changelog)

Untuk melihat riwayat pembaruan versi, silakan baca berkas [CHANGELOG.md](./CHANGELOG.md).

---

Dibuat untuk memudahkan warga RT 🏘️

