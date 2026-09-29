'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const features = [
  ['01','김해공항 가까이, 편안한 출발','공항 근처 형제주차장에 차를 세우고 가벼운 마음으로 여행을 시작하세요.\n처음 방문하셔도 입차 방법을 차근차근 안내해 드립니다.','/airport-parking-hero.webp','공항 주차를 표현한 연출 이미지'],
  ['02','공항까지 무료 셔틀 운행','주차를 마친 뒤 김해공항까지 무료 셔틀로\n이동하세요. 귀국 후에도 전화 한 통으로 돌아오는 길을 안내받으실 수 있습니다.','/parking-4.jpg','형제주차장 무료 셔틀 차량'],
  ['03','차량을 위한 세심한 관리','형제주차장의 보안 설비를 살펴보세요.\n차량을 맡기는 순간부터 찾는 순간까지 편안한 이용을 돕겠습니다.','/parking-3.jpg','형제주차장 CCTV 설비'],
];
const faqs = [
  ['온라인 예약 후 바로 확정되나요?','예약 신청을 보내주시면 담당자가 일정을 확인한 후 안내드립니다. 확정 안내를 받으셔야 예약이 완료됩니다.'],
  ['주차장 위치는 어디인가요?','부산광역시 강서구 대저2동 2432-4입니다. 방문 전 입차 안내를 확인해 주세요.'],
  ['무료 셔틀은 어떻게 이용하나요?','주차 후 김해공항까지 무료 셔틀을 이용하실 수 있습니다. 귀국 후에는 010-5700-7884로 연락해 주세요.'],
  ['예약 가능한 최소 기간이 있나요?','온라인 예약은 3일 이상 이용하실 때 신청할 수 있습니다. 짧은 일정은 전화로 문의해 주세요.'],
];
function AnimatedPrice({ target }) {
  const [value,setValue] = useState(0);
  const numberRef = useRef(null);
  useEffect(() => {
    const element=numberRef.current;
    if (!element) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {setValue(target);return;}
    let frame=0;
    const observer=new IntersectionObserver(([entry])=>{
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start=performance.now();
      const duration=1450;
      const tick=(now)=>{
        const progress=Math.min((now-start)/duration,1);
        const eased=1-Math.pow(1-progress,3);
        setValue(Math.round(target*eased/100)*100);
        if (progress<1) frame=requestAnimationFrame(tick);
        else setValue(target);
      };
      frame=requestAnimationFrame(tick);
    },{threshold:.45});
    observer.observe(element);
    return ()=>{observer.disconnect();cancelAnimationFrame(frame);};
  },[target]);
  return <strong ref={numberRef}>{value.toLocaleString('ko-KR')}</strong>;
}
export default function HomePage() {
  const [menuOpen,setMenuOpen] = useState(false);
  const [showScrollCue,setShowScrollCue] = useState(true);
  const [showFloatingCall,setShowFloatingCall] = useState(true);
  const [statusMessage,setStatusMessage] = useState('예약 신청 후 담당자의 확정 안내를 확인해 주세요.');
  const [statusError,setStatusError] = useState(false);
  useEffect(()=>{
    const updateCue=()=>setShowScrollCue(window.scrollY<24);
    updateCue();
    window.addEventListener('scroll',updateCue,{passive:true});
    return ()=>window.removeEventListener('scroll',updateCue);
  },[]);
  useEffect(()=>{
    const booking=document.getElementById('reservation');
    if (!booking) return;
    const observer=new IntersectionObserver(([entry])=>setShowFloatingCall(!entry.isIntersecting));
    observer.observe(booking);
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const targets=document.querySelectorAll('.intro h2,.intro p,.feature-row,.price-card,.how-grid article,.gallery img,.booking-intro,.booking-form,.faq-list details,.closing h2');
    const observer=new IntersectionObserver((entries)=>{
      entries.forEach((entry)=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});
    },{threshold:.08,rootMargin:'0px 0px -35px 0px'});
    targets.forEach((element)=>{element.classList.add('reveal-target');observer.observe(element);});
    return ()=>observer.disconnect();
  },[]);
  async function handleSubmit(event) {
    event.preventDefault();
    const form=event.currentTarget, values=Object.fromEntries(new FormData(form));
    const missingField=['name','phone','dest','plate','car'].find(key=>!String(values[key]??'').trim());
    if (missingField) {form.elements[missingField].focus();setStatusError(true);setStatusMessage('필수 항목을 모두 입력해 주세요.');return;}
    const entry=new Date(values.entry), exit=new Date(values.exit);
    if (Number.isNaN(entry.getTime()) || Number.isNaN(exit.getTime()) || exit<=entry) {setStatusError(true);setStatusMessage('입차와 출차 일시를 다시 확인해 주세요.');return;}
    if (entry.getTime()<Date.now()-60000) {setStatusError(true);setStatusMessage('지난 입차 시각은 예약할 수 없습니다. 일정을 다시 확인해 주세요.');return;}
    if (Math.ceil((exit-entry)/86400000)<3) {setStatusError(true);setStatusMessage('온라인 예약은 3일 이상부터 가능합니다.');return;}
    const [inDate,inTime]=values.entry.split('T'),[outDate,outTime]=values.exit.split('T');
    const data={name:values.name.trim(),phone:values.phone.trim(),route:values.route,dest:values.dest.trim(),plate:values.plate.trim(),car:values.car.trim(),people:values.people,golf:values.golf,note:values.note.trim(),inDate,inTime,outDate,outTime,createdAt:Date.now(),status:'접수대기'};
    const submit=form.querySelector('button[type=submit]');
    submit.disabled=true;setStatusError(false);setStatusMessage('예약을 접수하고 있습니다…');
    try {const result=await supabase.rpc('create_reservation',{p_data:data});if(result.error)throw result.error;form.reset();setStatusMessage('예약 신청이 접수되었습니다. 확정 안내를 기다려 주세요. 문의: 010-5700-7884');}
    catch {setStatusError(true);setStatusMessage('접수에 실패했습니다. 010-5700-7884로 전화해 주세요.');}
    finally {submit.disabled=false;}
  }
  return <>
    <header className="site-header"><div className="header-inner">
      <a className="logo" href="#top" aria-label="형제주차장 홈"><span className="logo-symbol">P<img src="/logo-airplane.webp" alt=""/></span><span className="logo-type">형제주차장<small>HYEONGJE PARKING</small></span></a>
      <nav className={menuOpen?'site-nav open':'site-nav'} aria-label="주요 메뉴">
        {['회사소개','이용안내','요금안내','예약하기','주차장시설','고객지원'].map((label,i)=><a key={label} onClick={()=>setMenuOpen(false)} href={['#about','#guide','#pricing','#reservation','#facilities','#faq'][i]}>{label}</a>)}
      </nav><a className="header-call" href="tel:01057007884">전화 상담&nbsp; 010-5700-7884</a>
      <button className="menu-toggle" aria-label={menuOpen?'메뉴 닫기':'메뉴 열기'} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}><img src={menuOpen?'/icon-close.webp':'/icon-menu.webp'} alt=""/></button>
    </div></header>
    <main id="top">
      <section className="hero"><div className="hero-content"><p>여행의 시작부터 끝까지,<br/>김해공항 주차의 편안한 선택</p><h1>HYEONGJE PARKING</h1><a className="primary-button" href="#reservation">온라인 예약하기 <img className="button-icon" src="/icon-arrow.webp" alt=""/></a></div><a className={showScrollCue?'scroll-cue':'scroll-cue hidden'} href="#about" aria-label="아래로 스크롤하여 소개 보기"><span className="scroll-label">SCROLL TO EXPLORE</span><span className="mouse-scene" aria-hidden="true"><span className="mouse-shell"><span className="mouse-seam"/><span className="mouse-wheel"/></span><span className="mouse-shadow"/></span><img className="scroll-chevron" src="/icon-chevron.webp" alt=""/></a></section>
      <section className="intro" id="about"><span className="eyebrow">김해공항 주차의 편안한 시작</span><h2>공항까지 가볍게,<br/>주차는 형제주차장에</h2><p>여행 전 주차부터 귀국 후 차량 인수까지<br/>믿고 맡길 수 있도록 정성을 다하겠습니다.</p></section>
      <section className="feature-list" id="guide" aria-label="형제주차장 이용 장점">{features.map(([num,title,description,image,alt])=><article className="feature-row" key={num}><div className="feature-copy"><span className="feature-number">{num}</span><h3>{title}</h3><p>{description}</p></div><div className="feature-image"><img src={image} alt={alt}/></div></article>)}</section>
      <section className="pricing" id="pricing"><div className="section-heading"><span className="eyebrow">PARKING PRICE</span><h2>명확한 주차 요금</h2><p>이용 일정을 확인하고 안내해 드립니다.</p></div><div className="price-grid"><article className="price-card"><span>WEEKDAY</span><h3>월요일 — 목요일</h3><div className="price"><AnimatedPrice target={9000}/>원 <small>/ 1일</small></div></article><article className="price-card"><span>WEEKEND</span><h3>금요일 — 일요일</h3><div className="price"><AnimatedPrice target={10000}/>원 <small>/ 1일</small></div></article></div><p className="price-note">정확한 총 요금과 공휴일 적용 요금은 예약 확정 시 안내드립니다.</p></section>
      <section className="how-to"><div className="section-heading"><span className="eyebrow">HOW TO USE</span><h2>이용 방법</h2><p>예약부터 귀국까지, 간단하게 이용하세요.</p></div><div className="how-grid">{[['온라인 예약','이용 일정과 차량 정보를 입력하고 예약을 신청하세요.'],['주차장 방문','확정 안내를 확인한 뒤 형제주차장으로 방문하세요.'],['무료 셔틀 이용','주차를 마치고 셔틀로 김해공항까지 이동하세요.'],['귀국 후 차량 인수','도착 후 전화 주시면 돌아오는 길을 안내해 드립니다.']].map(([title,copy],i)=><article key={title}><span>0{i+1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
      <section className="facilities" id="facilities"><div className="section-heading"><span className="eyebrow">OUR PARKING LOT</span><h2>형제주차장 둘러보기</h2><p>실제 셔틀 차량과 주차장 설비를 확인하세요.</p></div><div className="gallery"><img src="/parking-4.jpg" alt="형제주차장 무료 셔틀 차량"/><img src="/parking-3.jpg" alt="형제주차장 CCTV 설비"/><a className="map-link" href="https://map.naver.com/p/search/%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C%20%EA%B0%95%EC%84%9C%EA%B5%AC%20%EB%8C%80%EC%A0%802%EB%8F%99%202432-4" target="_blank" rel="noopener noreferrer" aria-label="형제주차장 위치 네이버 지도에서 보기"><img src="/parking-5.jpg" alt="형제주차장 위치 안내 지도"/><small>클릭 시 네이버 지도로 이동합니다.</small></a></div></section>
      <section className="booking" id="reservation"><div className="booking-intro"><span className="eyebrow">ONLINE RESERVATION</span><h2>여행 준비의 시작,<br/>지금 예약하세요.</h2><p>필요한 정보를 남겨주시면 확인 후 연락드리겠습니다. 담당자의 안내를 받으신 뒤 예약이 확정됩니다.</p><div className="booking-info"><strong>운영시간</strong><span>매일 04:40 – 21:30</span><strong>전화문의</strong><a href="tel:01057007884">010-5700-7884</a></div></div>
      <form className="booking-form" onSubmit={handleSubmit}><h3>온라인 예약 신청</h3><p>별표 표시 항목을 입력해 주세요.</p>
        <div className="field-row"><label>예약자명 *<input name="name" autoComplete="name" required placeholder="예약자 성함" maxLength="40"/></label><label>휴대폰 번호 *<input name="phone" type="tel" autoComplete="tel" inputMode="tel" required pattern="01[0-9](-| )?[0-9]{3,4}(-| )?[0-9]{4}" title="휴대폰 번호를 010-1234-5678 형식으로 입력해 주세요." placeholder="010-0000-0000" maxLength="20"/></label></div>
        <div className="field-row"><label>입차 예정 *<input name="entry" type="datetime-local" required/></label><label>출차 예정 *<input name="exit" type="datetime-local" required/></label></div>
        <div className="field-row"><label>항공노선 *<select name="route" required><option value="국제선">국제선</option><option value="국내선">국내선</option></select></label><label>여행지 *<input name="dest" required placeholder="예: 일본" maxLength="50"/></label></div>
        <div className="field-row"><label>차량번호 *<input name="plate" required placeholder="차량번호" maxLength="20"/></label><label>차량모델 *<input name="car" required placeholder="예: 아반떼" maxLength="40"/></label></div>
        <div className="field-row"><label>탑승 인원 *<input name="people" type="number" min="1" max="20" required placeholder="인원수"/></label><label>골프백 개수<select name="golf"><option value="0">0개</option><option value="1">1개</option><option value="2">2개</option><option value="3">3개</option><option value="4">4개</option></select></label></div>
        <label>요청사항<textarea name="note" rows="3" placeholder="필요한 내용을 남겨 주세요"/></label>
        <div className="agree-row"><label className="agree"><input name="consent" type="checkbox" required/><span>예약 접수를 위한 개인정보 수집·이용에 동의합니다.</span></label><a className="privacy-link" href="/privacy" target="_blank" rel="noopener noreferrer">개인정보 처리방침 보기</a></div>
        <button className="primary-button submit" type="submit">예약 신청하기 <img className="button-icon" src="/icon-arrow.webp" alt=""/></button><p className={statusError?'form-note error':'form-note'} role="status">{statusMessage}</p>
      </form></section>
      <section className="faq" id="faq"><div className="section-heading"><span className="eyebrow">FAQ</span><h2>자주 묻는 질문</h2><p>궁금한 내용을 확인해 보세요.</p></div><div className="faq-list">{faqs.map(([q,a])=><details key={q}><summary>{q}<img className="faq-plus" src="/icon-plus.webp" alt=""/></summary><p>{a}</p></details>)}</div></section>
      <section className="closing"><h2>여행의 시작도 끝도,<br/>형제주차장과 함께</h2><a className="primary-button" href="#reservation">온라인 예약하기 <img className="button-icon" src="/icon-arrow.webp" alt=""/></a></section>
    </main>
    <footer className="footer"><div className="footer-inner"><div><a className="footer-logo" href="#top">형제주차장 <small>HYEONGJE PARKING</small></a><p>부산광역시 강서구 대저2동 2432-4<br/>운영시간 04:40 – 21:30</p><a className="footer-privacy" href="/privacy">개인정보 처리방침</a></div><div><strong>고객센터</strong><a className="footer-phone" href="tel:01057007884">010-5700-7884</a><p>예약 및 이용 문의는 전화로 연락해 주세요.<br/><a className="footer-admin" href="/admin">관리자 페이지</a></p></div></div><div className="copyright">© 2026 HYEONGJE PARKING. ALL RIGHTS RESERVED.</div></footer>
    <a className={showFloatingCall?'floating-call':'floating-call is-hidden'} href="tel:01057007884" aria-hidden={!showFloatingCall} tabIndex={showFloatingCall?undefined:-1}><img className="support-icon" src="/support-headset.webp" alt=""/>상담원 연결</a>
  </>;
}
