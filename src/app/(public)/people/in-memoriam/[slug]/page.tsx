export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">In Memoriam Detail</h1>
      <p className="text-muted-foreground mt-2">Slug: {slug}</p>
    </main>
  );
}
