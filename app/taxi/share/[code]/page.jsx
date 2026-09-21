export const dynamic = "force-dynamic";
import ShareClient from './ShareClient';

export default function Page({ params }) {
  return <ShareClient code={params.code} />;
}
