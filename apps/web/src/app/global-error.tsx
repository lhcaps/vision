'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif', padding: 24 }}>
          <section style={{ maxWidth: 560 }}>
            <h1>Đã xảy ra lỗi hệ thống</h1>
            <p>Vui lòng thử tải lại trang. Nếu lỗi vẫn còn, kiểm tra API/Web log.</p>
            <p style={{ color: '#666', fontSize: 13 }}>{error?.message}</p>
            <button onClick={reset} style={{ padding: '10px 16px', cursor: 'pointer' }}>
              Thử lại
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
