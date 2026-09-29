import './globals.css';

export const metadata = {
  metadataBase: new URL('https://www.hjairport.com'),
  title: '형제주차장 김해공항점 | 김해공항 주차 예약',
  description: '김해공항 형제주차장. 무료 셔틀, 주차 요금 안내, 온라인 예약 신청.',
  alternates: { canonical: '/' },
  openGraph: {
    title: '형제주차장 김해공항점 | 김해공항 주차 예약',
    description: '차는 편하게, 여행은 가볍게. 형제주차장 김해공항점 온라인 예약.',
    url: '/',
    siteName: '형제주차장 김해공항점',
    locale: 'ko_KR',
    type: 'website',
    images: [{
      url: '/kakao-thumbnail-v3.jpg',
      width: 1200,
      height: 630,
      alt: '형제주차장 김해공항 주차 예약',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/kakao-thumbnail-v3.jpg'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
