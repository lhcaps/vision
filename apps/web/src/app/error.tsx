'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif', padding: 24 }}>
      <section style={{ maxWidth: 560 }}>
        <h1>Không thể tải trang</h1>
        <p>Vui lòng thử lại hoặc quay về trang chính.</p>
        <p style={{ color: '#666', fontSize: 13 }}>{error?.message}</p>
        <button onClick={reset} style={{ padding: '10px 16px', cursor: 'pointer' }}>
          Thử lại
        </button>
      </section>
    </main>
  );
}
