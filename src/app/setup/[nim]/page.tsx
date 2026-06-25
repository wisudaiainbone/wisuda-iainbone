import { getWisudawanByNim } from "@/actions/wisudawan";
import { notFound } from "next/navigation";
import SetupClient from "./SetupClient";

export default async function SetupPage({ params }: { params: Promise<{ nim: string }> }) {
  const { nim } = await params;
  const data = await getWisudawanByNim(nim, true);

  if (!data) return notFound();

  return <SetupClient nim={nim} nama={(data as any)["NAMA MAHASISWA"] || nim} initialToga={(data as any)["TOGA"] || ""} />;
}
