export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-10 text-3xl font-bold">이용약관</h1>

      <p className="text-muted-foreground text-base leading-relaxed">RoutePick 이용약관</p>

      <section>
        <h2 className="mt-8 mb-2 text-xl font-semibold">1. 목적</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          본 약관은 RoutePick 서비스 이용과 관련하여 서비스와 이용자 간의 권리와 의무를 규정합니다.
        </p>
      </section>

      <section>
        <h2 className="mt-8 mb-2 text-xl font-semibold">2. 서비스 내용</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          RoutePick은 다음 기능을 제공합니다.
        </p>
        <ul className="text-muted-foreground list-disc space-y-1 pl-6 text-base leading-relaxed">
          <li>드라이브 코스 추천</li>
          <li>위치 기반 장소 추천</li>
          <li>커뮤니티 게시글 작성 및 조회</li>
          <li>사용자 계정 관리</li>
        </ul>
      </section>

      <section>
        <h2 className="mt-8 mb-2 text-xl font-semibold">3. 회원가입</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          회원은 이메일 및 닉네임을 통해 가입할 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="mt-8 mb-2 text-xl font-semibold">4. 이용자의 의무</h2>
        <p className="text-muted-foreground text-base leading-relaxed">다음 행위를 금지합니다.</p>
        <ul className="text-muted-foreground list-disc space-y-1 pl-6 text-base leading-relaxed">
          <li>타인의 계정 도용</li>
          <li>불법 콘텐츠 게시</li>
          <li>서비스 운영 방해</li>
          <li>광고 및 스팸 게시</li>
        </ul>
      </section>

      <section>
        <h2 className="mt-8 mb-2 text-xl font-semibold">5. 게시물 책임</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          게시물의 책임은 작성자에게 있습니다. 서비스는 법령 위반 또는 정책 위반 게시물을 삭제할 수
          있습니다.
        </p>
      </section>

      <section>
        <h2 className="mt-8 mb-2 text-xl font-semibold">6. 서비스 책임 제한</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          서비스는 이용자가 게시한 정보의 정확성 및 외부 API 데이터 오류에 대해 책임을 지지
          않습니다.
        </p>
      </section>
    </div>
  );
}
