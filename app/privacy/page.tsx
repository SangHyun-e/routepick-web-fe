export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-10 text-3xl font-bold">개인정보처리방침</h1>

      <p className="text-muted-foreground text-base leading-relaxed">RoutePick 개인정보처리방침</p>

      <section>
        <h2 className="mt-8 mb-2 text-xl font-semibold">1. 수집하는 개인정보</h2>
        <p className="text-muted-foreground text-base leading-relaxed">회원가입 시</p>
        <ul className="text-muted-foreground list-disc space-y-1 pl-6 text-base leading-relaxed">
          <li>이메일</li>
          <li>닉네임</li>
          <li>비밀번호(암호화 저장)</li>
        </ul>
        <p className="text-muted-foreground mt-4 text-base leading-relaxed">서비스 이용 과정</p>
        <ul className="text-muted-foreground list-disc space-y-1 pl-6 text-base leading-relaxed">
          <li>로그인 기록</li>
          <li>게시글 작성 정보</li>
          <li>서비스 이용 로그</li>
        </ul>
      </section>

      <section>
        <h2 className="mt-8 mb-2 text-xl font-semibold">2. 개인정보 이용 목적</h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-6 text-base leading-relaxed">
          <li>회원 인증</li>
          <li>서비스 제공</li>
          <li>커뮤니티 기능 운영</li>
          <li>서비스 개선</li>
        </ul>
      </section>

      <section>
        <h2 className="mt-8 mb-2 text-xl font-semibold">3. 개인정보 보관 기간</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          회원 탈퇴 시 개인정보는 삭제됩니다.
        </p>
        <p className="text-muted-foreground mt-4 text-base leading-relaxed">
          단, 게시글 기록은 서비스 운영을 위해 작성자 정보가 &quot;탈퇴회원&quot; 형태로 표시될 수
          있습니다.
        </p>
      </section>

      <section>
        <h2 className="mt-8 mb-2 text-xl font-semibold">4. 개인정보 보호</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          비밀번호는 암호화하여 저장합니다.
        </p>
      </section>

      <section>
        <h2 className="mt-8 mb-2 text-xl font-semibold">5. 개인정보 제3자 제공</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          서비스는 개인정보를 외부에 제공하지 않습니다.
        </p>
        <p className="text-muted-foreground mt-4 text-base leading-relaxed">
          단, 법령에 따른 요청이 있을 경우 제공될 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="mt-8 mb-2 text-xl font-semibold">위치정보 이용 안내</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          서비스는 날씨 기반 드라이브 추천 기능을 위해 브라우저 위치 정보를 사용할 수 있습니다.
        </p>
        <p className="text-muted-foreground mt-4 text-base leading-relaxed">
          위치 정보는 추천 기능 수행 시에만 사용되며 서버에 저장되지 않습니다.
        </p>
        <p className="text-muted-foreground mt-4 text-base leading-relaxed">
          사용자는 브라우저 설정을 통해 위치 정보 제공을 거부할 수 있습니다.
        </p>
      </section>
    </div>
  );
}
