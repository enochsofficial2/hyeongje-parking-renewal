export const metadata = {
  title: '개인정보 처리방침 | 형제주차장 김해공항점',
  description: '형제주차장 김해공항점의 온라인 예약 개인정보 처리 안내',
};

export default function PrivacyPage() {
  return <main className="policy-page">
    <header className="policy-header"><a href="/" aria-label="형제주차장 홈으로"><span className="policy-mark">P<img src="/logo-airplane.webp" alt=""/></span><span>형제주차장<small>HYEONGJE PARKING</small></span></a><a href="/">홈으로 돌아가기</a></header>
    <div className="policy-content">
      <p className="eyebrow">PRIVACY POLICY</p>
      <h1>개인정보 처리방침</h1>
      <p className="policy-lead">형제주차장 김해공항점은 온라인 예약 신청에 필요한 개인정보를 아래와 같이 처리합니다.</p>
      <p className="policy-date">시행일: 2026년 9월 30일</p>

      <section><h2>1. 개인정보의 처리 목적</h2><p>예약 신청 접수, 예약 가능 여부 확인 및 확정 안내, 주차장·셔틀 이용 안내, 일정 변경 및 문의 응대를 위해 개인정보를 이용합니다. 이 목적 외 용도로 이용해야 할 때에는 별도 동의를 받거나 관련 법령에 따릅니다.</p></section>
      <section><h2>2. 처리하는 개인정보 항목</h2><ul><li><strong>필수:</strong> 예약자명, 휴대폰 번호, 입차·출차 예정 일시, 항공노선, 여행지, 차량번호, 차량모델, 탑승 인원</li><li><strong>추가 입력:</strong> 골프백 개수, 요청사항에 직접 기재한 내용</li></ul><p>요청사항에는 예약에 필요하지 않은 민감한 정보는 입력하지 말아 주세요.</p></section>
      <section><h2>3. 보유 및 이용 기간</h2><p>예약 정보는 예약 접수, 이용 및 사후 문의 처리에 필요한 기간 동안 보유합니다. 보유 목적이 끝나거나 정보주체의 삭제 요청을 처리할 때에는 관련 법령에 따른 보존 의무가 있는 경우를 제외하고 삭제합니다.</p></section>
      <section><h2>4. 개인정보의 제3자 제공 및 처리 서비스</h2><p>형제주차장 김해공항점은 원칙적으로 예약 정보를 다른 사업자에게 판매하거나 예약 목적과 무관하게 제공하지 않습니다. 온라인 예약 정보의 저장·처리에는 Supabase 클라우드 서비스를 이용합니다. 법령에 따른 요청이나 별도 동의가 필요한 제공 사항이 생기면 해당 기준에 따라 안내합니다.</p></section>
      <section><h2>5. 파기 방법 및 안전성 확보</h2><p>보유 목적이 끝난 전자적 예약 정보는 복구할 수 없도록 삭제합니다. 예약 정보 접근 권한을 필요한 담당자로 제한하고, 웹사이트와 예약 서비스 간 통신에 암호화 연결을 사용합니다.</p></section>
      <section><h2>6. 정보주체의 권리와 문의 방법</h2><p>예약자는 본인의 개인정보 열람, 정정, 삭제 또는 처리정지를 요청할 수 있습니다. 예약자명과 연락처를 확인할 수 있도록 아래 연락처로 문의해 주세요. 관계 법령상 제한되는 경우에는 그 사유를 안내합니다.</p></section>
      <section><h2>7. 개인정보 관련 연락처</h2><p>형제주차장 김해공항점<br/>부산광역시 강서구 대저2동 2432-4<br/><a href="tel:01057007884">010-5700-7884</a></p></section>
      <section><h2>8. 방침의 변경</h2><p>처리방침을 변경할 때에는 변경 내용을 이 페이지에 게시하고 시행일을 표시합니다.</p></section>
      <a className="policy-back" href="/">← 홈페이지로 돌아가기</a>
    </div>
  </main>;
}
