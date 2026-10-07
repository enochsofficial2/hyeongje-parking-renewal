import Board from './Board';
import {boardMetadata} from '../../lib/review-seo';
export const revalidate=300;
export async function generateMetadata(){return boardMetadata()}
export default function Reviews(){return <Board/>}
