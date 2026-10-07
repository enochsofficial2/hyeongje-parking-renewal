'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {readJourney,recordPath,safePath,track} from '../lib/attribution';
export default function Analytics({measurementId}){
 const pathname=usePathname();
 useEffect(()=>{
  if(pathname.startsWith('/admin'))return;
  const data=readJourney();
  if(measurementId&&/^G-[A-Z0-9]+$/.test(measurementId)){
   if(!window.hjGaInitialized){window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',measurementId,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:location.origin+safePath(location.href),page_referrer:data.journey.last.referrer,campaign_source:data.journey.last.source,campaign_medium:data.journey.last.medium,campaign_name:data.journey.last.campaign});
    const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+measurementId;document.head.append(script);window.hjGaInitialized=true;}
  }
  let sent=false;try{sent=sessionStorage.getItem('hj_visit_sent')===data.sessionId}catch{}
  if(!sent){track('visit');try{sessionStorage.setItem('hj_visit_sent',data.sessionId)}catch{}}
  recordPath(safePath(location.href));track('page_view');
  const seen=new Set();const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting&&!seen.has(e.target.id)){seen.add(e.target.id);recordPath(pathname+'#'+e.target.id,'section');track('section_view',{section:e.target.id})}}},{threshold:.25});
  document.querySelectorAll('section[id]').forEach(e=>observer.observe(e));
  const click=event=>{const a=event.target.closest?.('a');if(!a)return;const href=a.getAttribute('href')||'';if(href.startsWith('tel:'))track('phone_click');else if(href.startsWith('#')){recordPath(pathname+href,'navigation');track('navigation_click',{section:href.slice(1)})}else if(href){try{const destination=new URL(href,location.origin);if(destination.origin===location.origin){recordPath(safePath(destination.href),'navigation');track('navigation_click',{section:safePath(destination.href)})}else track('outbound_click',{section:destination.hostname})}catch{}}};
  let mark=performance.now(),elapsed=0,active=document.visibilityState==='visible'&&document.hasFocus();
  const accumulate=()=>{const now=performance.now();if(active)elapsed+=now-mark;mark=now;active=document.visibilityState==='visible'&&document.hasFocus()};
  const flush=()=>{accumulate();if(elapsed>=1000){track('engagement',{engagement_ms:Math.round(Math.min(60000,elapsed))});elapsed=0}};
  const visibility=()=>{accumulate();if(!active)flush()};
  const timer=setInterval(flush,15000);document.addEventListener('visibilitychange',visibility);window.addEventListener('focus',visibility);window.addEventListener('blur',visibility);window.addEventListener('pagehide',flush);
  let started=false;const start=event=>{if(!started&&event.target.closest?.('.booking-form')){started=true;track('reservation_start')}};
  const depths=new Set();const scroll=()=>{const height=document.documentElement.scrollHeight-innerHeight;if(height<=0)return;const percent=(scrollY/height)*100;for(const depth of [25,50,75,90])if(percent>=depth&&!depths.has(depth)){depths.add(depth);track('scroll_depth',{section:String(depth)})}};window.addEventListener('scroll',scroll,{passive:true});
  document.addEventListener('click',click);document.addEventListener('focusin',start);
  return()=>{window.removeEventListener('scroll',scroll);flush();clearInterval(timer);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('focus',visibility);window.removeEventListener('blur',visibility);window.removeEventListener('pagehide',flush);observer.disconnect();document.removeEventListener('click',click);document.removeEventListener('focusin',start)};
 },[pathname,measurementId]);return null;
}
