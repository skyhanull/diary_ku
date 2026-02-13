import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-14">
      <section className="rounded-2xl border bg-card p-7">
        <h1 className="text-3xl font-semibold">DearMe</h1>
        <p className="mt-3 text-sm text-foreground/80">현실 다꾸 감성을 웹으로 옮긴 디지털 다이어리 MVP.</p>

        <ul className="mt-5 list-disc space-y-1 pl-5 text-sm">
          <li>Supabase Auth/DB/Storage 기반</li>
          <li>캘린더 + 데일리 페이지</li>
          <li>스티커/텍스트/사진 에디터</li>
        </ul>

        <Link
          href="/auth"
          className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          로그인 화면으로 이동
        </Link>
        <Link
          href="/editor/demo-page"
          className="ml-2 mt-5 inline-flex rounded-md border border-input bg-white px-4 py-2 text-sm font-medium"
        >
          에디터 MVP 화면
        </Link>
      </section>
    </main>
  );
}
