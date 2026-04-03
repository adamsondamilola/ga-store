import LoginComponent from "@/components/Auth/login";

export default async function LoginPage({ searchParams }) {
  const search = searchParams?.username || '';

  return (
    <main>
      <LoginComponent />
    </main>
  );
}
