import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import WebsiteForm from "@/components/websites/WebsiteForm";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type EditWebsitePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditWebsitePage({
  params,
}: EditWebsitePageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const website = await prisma.website.findUnique({
    where: {
      id,
    },
  });

  if (!website) {
    notFound();
  }

  return (
    <main className="ps-page">
      <section className="ps-hero-light">
        <div className="ps-container">
        <Link
          href={`/websites/${website.id}`}
          className="ps-link text-sm"
        >
          ← Kembali ke Detail Website
        </Link>

        <h1 className="ps-display-lg mt-3">Edit Website</h1>
        <p className="ps-body-md mt-4 max-w-2xl text-[var(--ps-body-light)]">
          Ubah konfigurasi monitoring untuk {website.name}.
        </p>
        </div>
      </section>

      <div className="ps-container ps-content-stack">
      <WebsiteForm
        mode="edit"
        initialData={{
          id: website.id,
          name: website.name,
          url: website.url,
          checkIntervalSeconds: website.checkIntervalSeconds,
          timeoutSeconds: website.timeoutSeconds,
          expectedStatusCode: website.expectedStatusCode,
          expectedKeyword: website.expectedKeyword,
          degradedThresholdMs: website.degradedThresholdMs,
        }}
      />
      </div>
    </main>
  );
}
