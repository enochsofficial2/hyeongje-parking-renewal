import HomePage from '../page';
export const metadata={title:'온라인 예약 | 김해공항 형제주차장',description:'김해공항 주차 이용 일정과 차량 정보를 입력하고 형제주차장에 온라인 예약을 신청하세요.',alternates:{canonical:'/reservation'},openGraph:{url:'/reservation'}};
export default function Reservation(){return <HomePage reservationOnly/>}
