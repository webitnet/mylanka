import { Container } from "./Container";

export function PageStub({ title }: { title: string }) {
  return (
    <Container className="py-24 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-bark md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-muted">Coming soon.</p>
    </Container>
  );
}
