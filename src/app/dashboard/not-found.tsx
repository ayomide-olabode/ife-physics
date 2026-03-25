export default function DashboardNotFound() {
  return (
    <main className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 py-12 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        The page you are looking for does not exist or you do not have permission to access it.
      </p>
    </main>
  );
}
