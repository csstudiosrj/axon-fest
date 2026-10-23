import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ARXUM Fest",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-axon-bg text-white flex flex-col">
      {children}
    </div>
  );
}