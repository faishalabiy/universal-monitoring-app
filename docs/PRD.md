# Product Requirements Document

# Monitoring App

## 1. Ringkasan Produk

Monitoring App adalah aplikasi web untuk memonitor status, performa, dan ketersediaan berbagai website dalam satu dashboard terpusat.

Aplikasi ini melakukan pengecekan website secara berkala, menyimpan riwayat pengecekan, mendeteksi perubahan status, membuat incident otomatis, serta mengirimkan notifikasi ketika website mengalami gangguan atau kembali normal.

Fokus utama versi MVP adalah monitoring HTTP/HTTPS dengan dashboard internal yang dapat menampilkan perubahan data secara real-time tanpa perlu refresh halaman.

---

## 2. Latar Belakang

Saat mengelola banyak website, gangguan sering kali baru diketahui setelah ada laporan dari user atau tim lain. Hal ini menyebabkan respons menjadi lambat dan tidak ada data historis yang cukup untuk menganalisis uptime maupun performa website.

Monitoring App dibuat untuk menyediakan satu sistem internal yang dapat:

* memantau seluruh website,
* mendeteksi downtime,
* mencatat response time,
* mencatat histori incident,
* memberikan notifikasi otomatis,
* menyediakan ringkasan uptime.

---

## 3. Tujuan Produk

Tujuan utama aplikasi ini:

1. Menampilkan status semua website dalam satu dashboard.
2. Mengecek website secara otomatis berdasarkan interval tertentu.
3. Mendeteksi status UP, DOWN, DEGRADED, PAUSED, dan UNKNOWN.
4. Menyimpan histori pengecekan website.
5. Membuat incident otomatis saat website bermasalah.
6. Menyelesaikan incident otomatis saat website kembali normal.
7. Mengirim notifikasi saat website down atau recovered.
8. Menyediakan data uptime dan response time untuk laporan dasar.

---

## 4. Target Pengguna

### 4.1 Admin

Admin memiliki akses penuh untuk mengelola sistem.

Admin dapat:

* login,
* melihat dashboard,
* menambah website,
* mengubah website,
* menghapus website,
* pause/resume monitoring,
* melihat incident,
* mengatur notifikasi,
* melihat laporan uptime.

### 4.2 Viewer

Viewer hanya memiliki akses baca.

Viewer dapat:

* login,
* melihat dashboard,
* melihat daftar website,
* melihat detail website,
* melihat incident,
* melihat laporan.

Viewer tidak dapat:

* menambah website,
* mengubah website,
* menghapus website,
* mengubah konfigurasi monitoring,
* mengubah konfigurasi notifikasi.

---

## 5. Scope MVP

Fitur yang masuk MVP:

1. Authentication sederhana menggunakan email dan password.
2. Session menggunakan JWT di HTTP-only cookie.
3. Protected route untuk halaman internal.
4. CRUD website.
5. Pause dan resume monitoring website.
6. Monitoring HTTP/HTTPS.
7. Penyimpanan hasil check ke database.
8. Status website:

   * UP
   * DOWN
   * DEGRADED
   * PAUSED
   * UNKNOWN
9. Incident otomatis.
10. Dashboard internal.
11. Riwayat check website.
12. Basic uptime calculation.
13. Real-time update menggunakan Server-Sent Events.
14. Notifikasi Telegram untuk down dan recovered.

---

## 6. Out of Scope MVP

Fitur yang belum masuk MVP:

1. Multi-region monitoring.
2. Public status page.
3. SSL expiry monitoring.
4. Domain expiry monitoring.
5. Email notification.
6. Slack notification.
7. Discord notification.
8. WhatsApp notification.
9. PDF report.
10. Multi-tenant organization.
11. Advanced role management.
12. Synthetic transaction monitoring.
13. Browser automation monitoring.
14. Mobile native app.

---

## 7. Tech Stack

Stack yang digunakan:

* Frontend: Next.js App Router
* Backend: Next.js Route Handler
* Language: TypeScript
* Database: PostgreSQL
* ORM: Prisma
* Session: JWT menggunakan jose
* Password hashing: bcryptjs
* Queue/Worker: BullMQ dan Redis
* Real-time: Server-Sent Events
* Notification MVP: Telegram Bot
* Styling: Tailwind CSS
* Deployment awal: Node.js process + PostgreSQL existing + Redis Docker

---

## 8. Arsitektur Sistem

Komponen utama:

1. Web App
   Menampilkan dashboard, halaman website, halaman incident, dan halaman konfigurasi.

2. API Server
   Menyediakan endpoint untuk authentication, website management, incident, check history, dan event real-time.

3. PostgreSQL Database
   Menyimpan user, website, check result, incident, dan notification log.

4. Redis
   Digunakan untuk queue dan background job.

5. Monitoring Worker
   Melakukan pengecekan website secara berkala.

6. Notification Service
   Mengirim alert ke Telegram atau channel lain.

Alur utama:

1. Admin menambahkan website.
2. Website tersimpan ke database.
3. Worker membaca daftar website aktif.
4. Worker melakukan HTTP request ke website.
5. Worker menyimpan hasil pengecekan.
6. Worker menentukan status website.
7. Jika status berubah menjadi DOWN/DEGRADED, sistem membuat incident.
8. Jika website kembali UP, sistem menyelesaikan incident.
9. Dashboard menerima update.
10. Notifikasi dikirim jika diperlukan.

---

## 9. Status Website

### 9.1 UNKNOWN

Status awal website setelah dibuat dan belum pernah dicek.

### 9.2 UP

Website dianggap UP jika:

* request berhasil,
* status code sesuai konfigurasi,
* response time masih di bawah threshold,
* tidak terjadi timeout,
* tidak terjadi network error.

### 9.3 DOWN

Website dianggap DOWN jika:

* request timeout,
* DNS error,
* connection refused,
* SSL error,
* status code tidak sesuai expected status code,
* status code 5xx,
* expected keyword tidak ditemukan.

### 9.4 DEGRADED

Website dianggap DEGRADED jika:

* website masih dapat diakses,
* status code sesuai,
* tetapi response time melebihi degraded threshold.

### 9.5 PAUSED

Website berada dalam status PAUSED jika admin menonaktifkan monitoring sementara.

---

## 10. User Stories

### 10.1 Login

Sebagai user, saya ingin login agar hanya user yang memiliki akses yang dapat membuka dashboard monitoring.

Acceptance criteria:

* user dapat login menggunakan email dan password,
* password diverifikasi menggunakan hash,
* session disimpan di HTTP-only cookie,
* user yang belum login tidak dapat membuka halaman protected.

### 10.2 Website Management

Sebagai admin, saya ingin menambahkan website agar sistem dapat mulai memonitor website tersebut.

Acceptance criteria:

* admin dapat mengisi nama website,
* admin dapat mengisi URL,
* admin dapat mengatur interval check,
* admin dapat mengatur timeout,
* admin dapat mengatur expected status code,
* admin dapat mengatur degraded threshold,
* URL harus valid,
* website baru memiliki status UNKNOWN.

### 10.3 Edit Website

Sebagai admin, saya ingin mengubah konfigurasi website agar monitoring dapat disesuaikan.

Acceptance criteria:

* admin dapat mengubah nama,
* admin dapat mengubah URL,
* admin dapat mengubah interval,
* admin dapat mengubah timeout,
* admin dapat mengubah expected status code,
* admin dapat mengubah expected keyword,
* perubahan tersimpan ke database.

### 10.4 Delete Website

Sebagai admin, saya ingin menghapus website agar website tersebut tidak lagi dimonitor.

Acceptance criteria:

* admin dapat menghapus website,
* data website dihapus dari database,
* data check dan incident terkait ikut terhapus melalui relasi cascade.

### 10.5 Pause Monitoring

Sebagai admin, saya ingin menjeda monitoring website agar website yang sedang maintenance tidak memicu alert.

Acceptance criteria:

* admin dapat pause website,
* status website menjadi PAUSED,
* website yang di-pause tidak dicek worker,
* admin dapat resume kembali.

### 10.6 Dashboard

Sebagai user, saya ingin melihat semua status website dalam satu dashboard.

Acceptance criteria:

* dashboard menampilkan total website,
* dashboard menampilkan jumlah UP,
* dashboard menampilkan jumlah DOWN,
* dashboard menampilkan jumlah DEGRADED,
* dashboard menampilkan active incident,
* dashboard menampilkan last checked time,
* dashboard dapat diperbarui real-time.

### 10.7 Incident

Sebagai admin, saya ingin incident dibuat otomatis saat website bermasalah.

Acceptance criteria:

* incident dibuat saat website berubah menjadi DOWN atau DEGRADED,
* incident tidak dibuat berulang saat status masih bermasalah,
* incident diselesaikan otomatis saat website kembali UP,
* durasi incident dihitung otomatis.

### 10.8 Notification

Sebagai admin, saya ingin menerima notifikasi saat website down agar saya bisa segera menindaklanjuti.

Acceptance criteria:

* notifikasi dikirim saat website berubah menjadi DOWN,
* notifikasi dikirim saat website berubah menjadi DEGRADED,
* notifikasi dikirim saat website recovered,
* notifikasi mencantumkan nama website,
* notifikasi mencantumkan URL,
* notifikasi mencantumkan alasan error,
* notifikasi mencantumkan waktu kejadian.

---

## 11. Data Model

### 11.1 User

Field:

* id
* name
* email
* passwordHash
* role
* createdAt
* updatedAt

Role:

* ADMIN
* VIEWER

### 11.2 Website

Field:

* id
* name
* url
* type
* isActive
* checkIntervalSeconds
* timeoutSeconds
* expectedStatusCode
* expectedKeyword
* degradedThresholdMs
* currentStatus
* lastCheckedAt
* createdAt
* updatedAt

### 11.3 Check

Field:

* id
* websiteId
* status
* statusCode
* responseTimeMs
* errorMessage
* checkedAt

### 11.4 Incident

Field:

* id
* websiteId
* status
* startedAt
* resolvedAt
* durationSeconds
* reason
* createdAt
* updatedAt

### 11.5 NotificationChannel

Field:

* id
* name
* type
* configJson
* isActive
* createdAt
* updatedAt

### 11.6 NotificationLog

Field:

* id
* incidentId
* channelId
* status
* sentAt
* errorMessage

---

## 12. API Requirements

### 12.1 Authentication

Endpoint:

* POST /api/auth/login
* POST /api/auth/logout
* GET /api/auth/me

### 12.2 Website

Endpoint:

* GET /api/websites
* POST /api/websites
* GET /api/websites/[id]
* PATCH /api/websites/[id]
* DELETE /api/websites/[id]
* POST /api/websites/[id]/pause
* POST /api/websites/[id]/resume

### 12.3 Incident

Endpoint:

* GET /api/incidents
* GET /api/incidents/[id]

### 12.4 Realtime

Endpoint:

* GET /api/events

Event type:

* website.status_changed
* check.completed
* incident.created
* incident.resolved
* notification.sent

---

## 13. Business Rules

1. Website baru memiliki status UNKNOWN.
2. Website yang di-pause tidak boleh dicek worker.
3. Website yang di-resume kembali ke status UNKNOWN sampai check berikutnya.
4. Check result tetap disimpan walaupun status tidak berubah.
5. Incident hanya dibuat saat status berubah menjadi DOWN atau DEGRADED.
6. Incident tidak boleh dibuat berulang untuk masalah yang sama jika masih active.
7. Incident diselesaikan otomatis saat website kembali UP.
8. Notifikasi hanya dikirim saat status berubah.
9. Admin dapat melakukan semua aksi.
10. Viewer hanya dapat membaca data.
11. Password tidak boleh disimpan dalam bentuk plain text.
12. JWT session disimpan dalam HTTP-only cookie.
13. API protected harus menolak request tanpa session valid.

---

## 14. Non-functional Requirements

### 14.1 Security

* Password menggunakan bcrypt hash.
* Session menggunakan JWT.
* JWT disimpan di HTTP-only cookie.
* Route internal wajib protected.
* API create, update, delete hanya untuk ADMIN.
* Secret disimpan di environment variable.
* Token notifikasi tidak boleh diekspos ke frontend.

### 14.2 Performance

* Dashboard harus terbuka kurang dari 3 detik pada data MVP.
* Real-time update diterima maksimal 3 detik setelah event dibuat.
* Worker MVP minimal dapat mengecek 100 website.
* Response time dicatat dalam milidetik.

### 14.3 Reliability

* Error pada satu website tidak boleh menghentikan check website lain.
* Worker harus mencatat error check.
* Notification failure harus dicatat.
* Queue digunakan untuk job background.

### 14.4 Maintainability

* Kode ditulis menggunakan TypeScript.
* Logic monitoring dipisah dari UI.
* Logic notification dipisah dari incident.
* Prisma schema menjadi sumber utama struktur database.
* File dokumentasi disimpan di folder docs.

---

## 15. Roadmap Pengembangan

### Phase 1 - Foundation

Status: selesai sebagian.

Deliverables:

* Next.js project
* struktur folder
* PostgreSQL connection
* Prisma schema
* migration
* seed admin
* auth login/logout
* protected route

### Phase 2 - Website Management

Status: selesai sebagian.

Deliverables:

* CRUD website API
* halaman website list
* halaman tambah website
* validasi input website
* pause/resume website
* delete website

### Phase 3 - Monitoring Worker

Deliverables:

* function check website
* worker process
* simpan check result
* update status website
* status transition logic

### Phase 4 - Incident Management

Deliverables:

* create incident otomatis
* resolve incident otomatis
* incident list
* incident detail
* duration calculation

### Phase 5 - Real-time Dashboard

Deliverables:

* event bus
* SSE endpoint
* dashboard realtime listener
* update summary card
* update website status card

### Phase 6 - Notification

Deliverables:

* Telegram bot integration
* notification service
* notification log
* alert saat DOWN
* alert saat RECOVERED

### Phase 7 - Report

Deliverables:

* uptime 24 jam
* uptime 7 hari
* uptime 30 hari
* response time chart
* incident summary

### Phase 8 - Production Readiness

Deliverables:

* Docker production setup
* environment configuration
* backup guide
* cleanup old checks
* logging
* error handling
* deployment checklist

---

## 16. Definition of Done MVP

MVP dianggap selesai jika:

1. Admin dapat login dan logout.
2. Protected route berjalan.
3. Admin dapat menambah website.
4. Admin dapat mengubah website.
5. Admin dapat menghapus website.
6. Admin dapat pause dan resume monitoring.
7. Worker dapat mengecek website otomatis.
8. Check result tersimpan ke database.
9. Website status berubah sesuai hasil check.
10. Incident dibuat otomatis saat website bermasalah.
11. Incident resolved otomatis saat website pulih.
12. Dashboard menampilkan status website.
13. Dashboard dapat menerima update real-time.
14. Telegram alert terkirim saat website down.
15. Telegram alert terkirim saat website recovered.
16. Uptime report dasar tersedia.
