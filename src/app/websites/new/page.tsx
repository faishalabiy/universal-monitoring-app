import WebsiteForm from "@/components/websites/WebsiteForm";

export default function NewWebsitePage() {
  return (
    <main className="ps-page">
      <section className="ps-hero-light">
        <div className="ps-container">
          <h1 className="ps-display-lg">Tambah Website</h1>
          <p className="ps-body-md mt-4 max-w-2xl text-[var(--ps-body-light)]">
            Tambahkan website yang ingin dimonitor.
          </p>
        </div>
      </section>

      <div className="ps-container ps-content-stack">
        <WebsiteForm />
      </div>
    </main>
  );
}
