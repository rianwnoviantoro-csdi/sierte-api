# Changelog Sierte API (Bot WhatsApp RT)

Entri baru di-_generate_ secara otomatis oleh GitHub Actions. Entri lama dipertahankan di bawah.

---

## [v0.1.1] - 2026-03-25

### 🔧 Code Refactoring

- Memperbarui GitHub Actions workflow (`release.yml`): versi kini di-bump otomatis berdasarkan **Conventional Commits** dan disinkronkan ke `package.json` tanpa intervensi manual.

---

## [v0.1.0] - 2026-03-25

### ✨ Fitur Baru

- **Drizzle ORM & PostgreSQL**:
  - Mengintegrasikan Drizzle ORM secara terpusat melalui `DatabaseModule` global di NestJS.
  - Skema database termodularisasi: satu file per tabel (`user.schema.ts`, `role.schema.ts`, `user-role.schema.ts`).
  - UUID sebagai *Primary Key* di seluruh tabel.
  - Relasi *Many-to-Many* antara `users` dan `roles` melalui tabel `user_roles`.
  - Kolom autentikasi lengkap di tabel `users`: `password`, `status`, `is_locked`, `locked_at`, `failed_login_attempts`.
- **Indexing Database yang Komprehensif**:
  - `users`: index pada `name`, `status`, `is_locked`, `locked_at`, `created_at`.
  - `roles`: index pada `created_at`.
  - `user_roles`: index individual pada `user_id` dan `role_id`.
- **Sistem Database Seeding Modular**:
  - Arsitektur seeder termodular di `src/database/seeds/`.
  - Akun admin default tersedia setelah menjalankan `yarn db:seed`.
- **Call Auto-Reject & Reminder**:
  - Bot otomatis menolak panggilan suara & video call dan mengirim notifikasi ke penelepon.
- **Smart Group Authentication & Filtering**:
  - `Private Message Blocking`: bot mengabaikan semua pesan japri.
  - `Group Whitelist (ALLOWED_GROUPS)`: bot hanya merespons grup yang terdaftar.
- **Mention System Response**: bot hanya aktif ketika di-_mention_ langsung di dalam grup.
- **Human-like Chat Behavior**: Read receipt, status mengetik, dan jeda acak sebelum membalas.
- **Login berbasis Console Terminal**: QR Code di terminal untuk pairing, sesi tersimpan otomatis.

### 🔧 Perbaikan Internal

- Menambahkan script database di `package.json`: `db:generate`, `db:migrate`, `db:push`, `db:seed`, `db:studio`.
- Refaktor `whatsapp.service.ts` untuk memisahkan logika `handleIncomingMessage`.

---

## [v0.0.1] - 2026-03-25

Rilis pertama project sebagai fondasi awal.

---
_Dibuat untuk merekap jejak pengembangan dari awal agar mempermudah monitoring ke depan._
