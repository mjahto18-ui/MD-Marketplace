export const dynamic = "force-dynamic";
import ShareSOSClient from './ShareSOSClient';

export default function Page({ params }) {
  return <ShareSOSClient orderCode={params.orderCode} id={params.id} />;
}
