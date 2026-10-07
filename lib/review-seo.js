import {getReviews} from './reviews';
const origin='https://www.hjairport.com';
const images=[{url:'/kakao-thumbnail-v3.jpg',width:1200,height:630,alt:'형제주차장 김해공항점'}];
export function reviewMetadata({title,description,path,published=true,article=false}) {
 return {title,description,alternates:{canonical:path},robots:{index:published,follow:true},openGraph:{title,description,url:path,type:article?'article':'website',locale:'ko_KR',siteName:'형제주차장 김해공항점',images},twitter:{card:'summary_large_image',title,description,images:images.map(image=>image.url)}};
}
export async function boardMetadata(page=1) {
 const data=await getReviews(page);
 return reviewMetadata({title:page===1?'김해공항 주차 이용후기 | 형제주차장 김해공항점':`김해공항 주차 이용후기 ${page}페이지 | 형제주차장`,description:data.total?'공항 앞에서 차량을 맡기고 귀국 후 돌려받은 고객들의 이용 경험을 확인하세요. 형제주차장의 차량 인수·반납, 주차장 보관과 예약 서비스에 관한 실제 후기를 작성자와 등록일별로 살펴볼 수 있습니다.':'이용후기를 준비하고 있습니다. 김해공항 앞 고객 차량 인수·반납 절차와 주차 요금은 이용안내에서 확인할 수 있습니다.',path:page===1?'/reviews':'/reviews/page/'+page,published:data.rows.length>0});
}
export function reviewBreadcrumbs(title,path) {
 const items=[{name:'홈',path:'/'},{name:'이용후기',path:'/reviews'}];if(path!=='/reviews')items.push({name:title,path});
 return {'@type':'BreadcrumbList',itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,item:origin+item.path}))};
}
export function serializeSchema(value){return JSON.stringify(value).replace(/</g,'\\u003c')}
