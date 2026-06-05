export default function SettingsPage() {
  return (
    <main className="ps-page">
      <section className="ps-hero-dark">
        <div className="ps-container">
          <h1 className="ps-display-lg">Settings</h1>
          <p className="ps-body-md mt-4 max-w-2xl text-[var(--ps-body-dark)]">
            Pengaturan aplikasi akan ditampilkan di sini.
          </p>
        </div>
      </section>

      <div className="ps-container ps-content-stack">
        <section className="ps-card-soft p-6">
          <h2 className="ps-heading-lg">Monitoring preferences</h2>
          <p className="ps-body-sm mt-3 max-w-2xl text-[var(--ps-body-light)]">
            Area ini disiapkan untuk konfigurasi channel notifikasi, worker, dan
            policy monitoring.
          </p>
        </section>
      </div>
    </main>
  );
}
