# 형제주차장 김해공항점 홈페이지

Next.js 홈페이지는 Vercel에서, 예약 API·관리자 인증·방문 분석은 Cloudflare Workers와 D1에서 운영합니다. 파일 보관함은 R2 바인딩을 사용합니다.

예약 신청은 `/`, 예약·유입 관리는 `/admin`에서 이용합니다. 기존 관리자 이메일과 비밀번호를 D1으로 이전했습니다. 로그인 세션은 서버의 HttpOnly 쿠키로 관리합니다. 예약 조회는 50건씩 서버 페이지네이션하며 검색·날짜·상태 필터와 전체 검색 결과 CSV를 지원합니다.

## 로컬 실행

```bash
npm install
npm run dev -- --port 4173
```

로컬과 Vercel에는 `CLOUDFLARE_API_URL`, `CLOUDFLARE_PROXY_SECRET`, `NEXT_PUBLIC_GA4_ID`를 설정합니다. Workers의 `PROXY_SECRET`과 Vercel의 프록시 비밀키가 같아야 합니다. 키는 클라이언트에 노출하지 않습니다.

## 백엔드 배포

`npx wrangler d1 migrations apply hyeongje-parking --remote --config cloudflare/wrangler.jsonc`

`npx wrangler deploy --config cloudflare/wrangler.jsonc`

R2 활성화 후 `hyeongje-parking-assets` 버킷을 만들고 `STORAGE` 바인딩을 연결합니다. 원본 DB 백업은 Git에서 제외한 `.migration/`에 저장됩니다. 원본 Supabase 프로젝트는 자동으로 제거하지 않습니다.

## 유입 추적

최초·2차·예약 시점의 출처, UTM 캠페인/소재, 광고 ID, 방문·섹션 이동을 동일 브라우저 기준으로 최대 90일 기록합니다. 과거 예약의 유입은 추정하지 않습니다. `fbclid`만으로 유료 광고로 분류하지 않습니다. 예약 완료 이벤트는 서버 저장 성공 후에만 `generate_lead`로 GA4에 전송하며 예약자 개인정보는 전송하지 않습니다. GA4 속성은 `555951406`, 측정 ID는 `G-B8B6ZPMY8V`입니다.

## 배포

Vercel의 Next.js 프레임워크 프리셋으로 배포합니다. 빌드 명령은 `npm run build`입니다.

## 예약 알림 연동

고객·관리자 카카오 알림톡은 아직 연결되지 않았습니다. 솔라피의 형제주차장 발신 프로필, 승인된 고객/관리자 템플릿, API 인증 정보와 개인정보 처리 정책이 준비되면 별도 서버 API로 연결해야 합니다.


## 보고서와 검색 등록

GA4 Data API 보고서는 Workers의 `GA_CLIENT_EMAIL`, `GA_PRIVATE_KEY` 비밀키와 `GA_PROPERTY_ID`로 읽습니다. 서비스 계정에는 해당 속성 뷰어 권한이 필요합니다. 자체 체류시간은 화면 표시·초점 상태만 15초 간격으로 기록합니다. GA4는 자체 user_engagement와 보고서의 userEngagementDuration을 사용합니다.

검색용 독립 주소는 `/about`, `/guide`, `/pricing`, `/reservation`, `/facilities`, `/faq`입니다. robots.txt와 sitemap.xml, 고정 favicon.ico/favicon.png, WebSite/LocalBusiness/BreadcrumbList 구조화 데이터를 제공합니다. 네이버 소유 확인 메타 태그를 배포했습니다. 사이트링크와 파비콘 검색 노출은 검색엔진의 재수집·선택에 따릅니다.
