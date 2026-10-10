# Bomber Burger Smart Menu

Prototype menu digital berbasis QR dengan rekomendasi menu bertenaga AI untuk **Bomber Burger**. Customer memindai QR code di antrean counter, lalu memilih menu terlebih dahulu sambil menunggu giliran sebelum sampai ke kasir.

> Proyek tugas kuliah, dikerjakan bersama pihak restoran Bomber Burger sebagai mitra. Ini bukan produk resmi Bomber Burger.

## Status proyek

| Bagian | Status |
|---|---|
| Frontend (React + Vite + Tailwind) | Berjalan sebagai prototype |
| Data menu (23 item) dan foto menu | Terpasang |
| Rekomendasi AI | **Simulasi** (pencocokan aturan di sisi klien) |
| Backend AI (Claude API) | Direncanakan, belum dikerjakan |
| Database | Tidak dipakai (data menu dari file JSON) |

## Konsep

- **Tanpa login dan tanpa download aplikasi.** Cukup scan QR.
- **Tidak ada keranjang, checkout, atau pembayaran.** Restoran sudah punya sistem pembayaran sendiri di kasir.
- Sebagai pengganti keranjang, ada halaman **Pilihanku**: daftar menu yang disimpan customer, lalu disebutkan atau ditunjukkan ke kasir.

## Fitur

- **Bantu Aku Pilih (AI):** customer mengisi preferensi lewat chip (rasa, protein, porsi, bahan yang dihindari, situasi) dan kolom cerita bebas, lalu mendapat 3 rekomendasi menu beserta alasannya.
- **Eksplorasi menu manual:** pencarian, tab kategori, dan filter rasa.
- **Detail menu:** foto, profil rasa, bahan utama, dan catatan bahan.
- **Pilihanku:** simpan, hapus, dan tampilkan daftar pilihan ke kasir.
- Tampilan mobile-first dengan bahasa antarmuka Indonesia.

## Alur pengguna

```
Home
 ├─ Pakai AI → Input Preferensi → Loading → Hasil Rekomendasi
 │                                   ├─ Puas  → Pilihanku
 │                                   └─ Belum → kembali ke Input Preferensi
 └─ Tanpa AI → Eksplorasi Menu → Detail Menu → Pilihanku
```

## Teknologi

- React + Vite
- Tailwind CSS
- Data menu dalam file JSON, foto menu dalam format `.webp`

**Rencana (backend AI):** Claude API (model Claude Haiku 5.5) melalui satu endpoint serverless. API key hanya disimpan di server, tidak pernah di frontend.
