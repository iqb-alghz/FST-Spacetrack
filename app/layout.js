import "./globals.css";

export const metadata = {
  title: "FST-Spacetrack | Monitoring & Peminjaman Ruang Kuliah",
  description:
    "Sistem pelacakan ketersediaan ruang kuliah, penguncian sementara 15 menit, dan verifikasi check-in berbasis OCR di Fakultas Sains dan Teknologi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
