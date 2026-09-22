export const dynamic = "force-dynamic";
import ShareClient from './ShareClient';

export default function Page({ params }) {
  // هلق params فيه orderCode و id
  return <ShareClient orderCode={params.orderCode} id={params.id} />;
}
