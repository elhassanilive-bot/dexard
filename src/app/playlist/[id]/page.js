import PlaylistDetailsPageClient from "@/components/video/PlaylistDetailsPageClient";

export default async function PlaylistDetailsPage({ params }) {
  const { id } = await params;
  return <PlaylistDetailsPageClient playlistId={id} />;
}
