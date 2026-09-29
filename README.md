# 형제주차장 김해공항점 홈페이지

김해공항점의 공개 정보를 바탕으로 제작한 Next.js App Router 홈페이지입니다. 온라인 예약은 기존 Supabase 예약 시스템의 `create_reservation` RPC에 접수됩니다.

예약 신청은 `/`에서, 예약 관리는 `/admin`에서 이용합니다. 관리자는 기존 Supabase Auth 계정으로 로그인하며, 예약 목록과 상태를 관리할 수 있습니다. 개인정보 처리방침은 `/privacy`에 있습니다.

## 로컬 실행

```bash
npm install
npm run dev -- --port 4173
```

로컬과 Vercel에는 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 설정해야 합니다. 이 값은 공개 가능한 Supabase 연결 정보입니다. 관리자 비밀번호는 프런트엔드 환경변수로 넣지 않고 Supabase Auth에서 검증합니다.

## 배포

Vercel의 Next.js 프레임워크 프리셋으로 배포합니다. 빌드 명령은 `npm run build`입니다.

## 예약 알림 연동

고객·관리자 카카오 알림톡은 아직 연결되지 않았습니다. 솔라피의 형제주차장 발신 프로필, 승인된 고객/관리자 템플릿, API 인증 정보와 개인정보 처리 정책이 준비되면 별도 서버 API로 연결해야 합니다.

