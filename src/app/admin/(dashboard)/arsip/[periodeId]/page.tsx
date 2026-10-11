import ArsipMenuCards from "./ArsipMenuCards";

type PageProps = {
  params: Promise<{ periodeId: string }>;
};

export default async function ArsipIndexPage({ params }: PageProps) {
  const { periodeId } = await params;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--color-text)]">Pilih Menu Data Arsip</h2>
        <p className="text-[var(--color-text-muted)] mt-1">
          Data pada arsip bersifat read-only (hanya-baca) dan tidak dapat diubah kecuali oleh Superadmin.
        </p>
      </div>

      <ArsipMenuCards periodeId={periodeId} />
    </div>
  );
}