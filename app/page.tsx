import { RegistrationForm } from "@/components/RegistrationForm";

export default function HomePage() {
  return (
    <main className="page-shell min-h-screen px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[640px]">
        <RegistrationForm />
      </div>
    </main>
  );
}
