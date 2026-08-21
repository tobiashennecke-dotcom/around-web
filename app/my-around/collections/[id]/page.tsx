import { CollectionDetailClient } from "./CollectionDetailClient";

export default async function MyCollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main><CollectionDetailClient id={id} /></main>;
}
