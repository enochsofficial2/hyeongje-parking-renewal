import {allReviews} from '../lib/reviews';
export const revalidate=300;
export default async function sitemap(){
 const rows=await allReviews();const paths=['','/about','/guide','/pricing','/reservation','/faq','/privacy'];
 if(rows.length){paths.push('/reviews');for(let page=2;page<=Math.ceil(rows.length/20);page++)paths.push('/reviews/page/'+page)}
 return [...paths.map(path=>({url:'https://www.hjairport.com'+path,changeFrequency:path?'monthly':'weekly',priority:path?0.8:1})),...rows.map(r=>({url:'https://www.hjairport.com/reviews/'+r.id,lastModified:new Date(r.updated_at),changeFrequency:'monthly',priority:.6}))];
}
