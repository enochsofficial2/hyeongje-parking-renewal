'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

const columns = 'id,created_at,name,phone,route,dest,plate,car,people,golf,note,in_date,in_time,out_date,out_time,status';

export default function AdminPage() {
  const [session,setSession]=useState(null);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [rows,setRows]=useState([]);
  const [query,setQuery]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');

  const loadReservations=useCallback(async()=>{
    setBusy(true);
    const {data,error}=await supabase.from('reservations').select(columns).order('created_at',{ascending:false}).limit(500);
    setBusy(false);
    if(error){setMessage('예약 목록을 불러오지 못했습니다. 관리자 권한을 확인해 주세요.');return;}
    setRows(data??[]);
    setMessage('');
  },[]);

  useEffect(()=>{
    let active=true;
    supabase.auth.getSession().then(({data})=>{if(active)setSession(data.session)});
    const {data:subscription}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
    return ()=>{active=false;subscription.subscription.unsubscribe()};
  },[]);
  useEffect(()=>{if(session)loadReservations();else setRows([])},[session,loadReservations]);

  async function login(event){
    event.preventDefault();
    setBusy(true);setMessage('');
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    setBusy(false);
    if(error)setMessage('이메일 또는 비밀번호가 올바르지 않습니다.');
    else setPassword('');
  }
  async function logout(){await supabase.auth.signOut();setMessage('')}
  async function changeStatus(id,status){
    const {error}=await supabase.from('reservations').update({status}).eq('id',id);
    if(error){setMessage('상태를 저장하지 못했습니다. 관리자 권한을 확인해 주세요.');return;}
    setRows(current=>current.map(row=>row.id===id?{...row,status}:row));
  }
  const filtered=useMemo(()=>{
    const term=query.trim().toLowerCase();
    if(!term)return rows;
    return rows.filter(row=>[row.name,row.phone,row.plate,row.dest].some(value=>String(value??'').toLowerCase().includes(term)));
  },[rows,query]);
  function exportCsv(){
    const headers=['접수일','예약자','연락처','입차일','입차시간','출차일','출차시간','노선','여행지','차량번호','차량모델','인원','골프백','요청사항','상태'];
    const values=filtered.map(row=>[row.created_at,row.name,row.phone,row.in_date,row.in_time,row.out_date,row.out_time,row.route,row.dest,row.plate,row.car,row.people,row.golf,row.note,row.status]);
    const csv='\uFEFF'+[headers,...values].map(line=>line.map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='형제주차장-예약목록.csv';link.click();URL.revokeObjectURL(url);
  }

  return <main className="admin-page">
    <header className="admin-header"><a href="/">형제주차장 <small>HYEONGJE PARKING</small></a><a href="/">사이트로 돌아가기</a></header>
    <div className="admin-content">
      <span className="eyebrow">ADMIN DASHBOARD</span><h1>예약 관리자</h1>
      {!session?<form className="admin-login" onSubmit={login}><h2>관리자 로그인</h2><p>기존 형제주차장 관리자 계정으로 로그인하세요.</p><label>이메일<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>비밀번호<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="primary-button" type="submit" disabled={busy}>{busy?'로그인 중…':'로그인'}</button>{message&&<p className="admin-message" role="alert">{message}</p>}</form>:
      <section className="admin-panel"><div className="admin-actions"><div><strong>예약 신청 {filtered.length}건</strong><span>최신 500건 표시</span></div><div><input type="search" placeholder="이름·연락처·차량번호 검색" value={query} onChange={e=>setQuery(e.target.value)} aria-label="예약 검색"/><button onClick={loadReservations} disabled={busy}>새로고침</button><button onClick={exportCsv} disabled={!filtered.length}>CSV 다운로드</button><button onClick={logout}>로그아웃</button></div></div>{message&&<p className="admin-message" role="alert">{message}</p>}<div className="admin-table-wrap"><table><thead><tr><th>접수일</th><th>예약자</th><th>연락처</th><th>입차</th><th>출차</th><th>노선 / 여행지</th><th>차량</th><th>인원</th><th>요청사항</th><th>상태</th></tr></thead><tbody>{filtered.map(row=><tr key={row.id}><td>{row.created_at?.slice(0,16)?.replace('T',' ')}</td><td>{row.name}</td><td>{row.phone}</td><td>{row.in_date}<br/>{row.in_time}</td><td>{row.out_date}<br/>{row.out_time}</td><td>{row.route} / {row.dest}</td><td>{row.plate}<br/>{row.car}</td><td>{row.people}명</td><td className="admin-note">{row.note||'—'}</td><td><select aria-label={row.name+' 예약 상태'} value={row.status??'접수대기'} onChange={e=>changeStatus(row.id,e.target.value)}><option value="접수대기">접수대기</option><option value="확정">확정</option><option value="이용완료">이용완료</option><option value="취소">취소</option></select></td></tr>)}</tbody></table>{!busy&&!filtered.length&&<p className="admin-empty">표시할 예약이 없습니다.</p>}</div></section>}
    </div>
  </main>;
}
