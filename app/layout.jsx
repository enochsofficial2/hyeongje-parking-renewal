import './globals.css';
import Analytics from './Analytics';

export const metadata = {
  verification:{other:{'naver-site-verification':'4ddca78d0bb63c35d54f62c79adb7664dc6982f2'}},
  metadataBase: new URL('https://www.hjairport.com'),
  title: '김해공항 형제주차장 | 김해공항 주차 예약',
  description: '김해공항 형제주차장. 공항 앞 고객 차량 인수·반납, 주차 요금 안내, 온라인 예약 신청.',
  alternates: { canonical: '/' },
  icons:{icon:[{url:'/favicon.ico',sizes:'128x128',type:'image/x-icon'},{url:'/favicon.png',sizes:'128x128',type:'image/png'}],apple:'/favicon.png'},
  openGraph: {
    title: '김해공항 형제주차장 | 김해공항 주차 예약',
    description: '차는 편하게, 여행은 가볍게. 김해공항 형제주차장 온라인 예약.',
    url: '/',
    siteName: '김해공항 형제주차장',
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
      <body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'WebSite','@id':'https://www.hjairport.com/#website',url:'https://www.hjairport.com',name:'김해공항 형제주차장',alternateName:['형제주차장 김해공항점','형제주차장'],inLanguage:'ko-KR'},{'@type':'LocalBusiness','@id':'https://www.hjairport.com/#business',name:'김해공항 형제주차장',url:'https://www.hjairport.com',image:'https://www.hjairport.com/parking-4.jpg',logo:'https://www.hjairport.com/favicon.png',telephone:'+82-10-5700-7884',address:{'@type':'PostalAddress',streetAddress:'대저2동 2432-4',addressLocality:'강서구',addressRegion:'부산광역시',addressCountry:'KR'},openingHoursSpecification:{'@type':'OpeningHoursSpecification',dayOfWeek:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],opens:'04:40',closes:'21:30'}}]})}}/>{children}<Analytics measurementId={process.env.NEXT_PUBLIC_GA4_ID}/></body>
    </html>
  );
}
