import { RegistrationForm } from "@/components/RegistrationForm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-[640px]">
        <header className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-primary mb-2">
            Hackathon 2026
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-medium text-text mb-3">
            Team Registration
          </h1>
          <p className="text-text-muted text-base leading-relaxed">
            Register your team for the hackathon. Add members dynamically and
            ensure all requirements are met before submitting.
          </p>
        </header>

        <RegistrationForm />
      </div>
    </main>
  );
}
