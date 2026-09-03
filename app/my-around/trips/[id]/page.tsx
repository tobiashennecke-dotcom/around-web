import { TripDetailClient } from "./TripDetailClient";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main><TripDetailClient id={id} /></main>;
}
