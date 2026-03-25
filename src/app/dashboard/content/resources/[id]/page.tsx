export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">Edit Resource</h1>
      <p className="text-muted-foreground mt-2">{id}</p>
    </main>
  );
}
