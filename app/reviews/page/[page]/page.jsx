import Board from '../../Board';
import {notFound,permanentRedirect} from 'next/navigation';
import {boardMetadata} from '../../../../lib/review-seo';
export const revalidate=300;
export function generateStaticParams(){return []}
function pageNumber(value){if(!/^[1-9]\d*$/.test(value)||!Number.isSafeInteger(Number(value)))notFound();return Number(value)}
export async function generateMetadata({params}){const {page}=await params;return boardMetadata(pageNumber(page))}
export default async function Reviews({params}){const {page}=await params;const number=pageNumber(page);if(number===1)permanentRedirect('/reviews');return <Board page={number}/>}
