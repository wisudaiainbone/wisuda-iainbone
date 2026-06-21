export default function WisudawanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="no-scrollbar"
      style={{
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        position: "relative",
        backgroundColor: "var(--color-bg)",
      }}
    >
      {children}
    </div>
  );
}
