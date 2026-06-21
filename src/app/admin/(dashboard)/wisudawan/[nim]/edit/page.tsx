import { getWisudawanByNim } from "@/actions/wisudawan";
import { getProdiList } from "@/actions/prodi";
import { notFound } from "next/navigation";
import AdminEditWisudawanClient from "./AdminEditWisudawanClient";

export const metadata = {
  title: "Edit Data Wisudawan — Portal Admin",
};

export default async function AdminEditWisudawanPage({
  params,
}: {
  params: Promise<{ nim: string }>;
}) {
  const { nim } = await params;
  const [data, prodiList] = await Promise.all([
    getWisudawanByNim(nim),
    getProdiList(),
  ]);

  if (!data) return notFound();

  return (
    <div className="w-full pb-10">
      <AdminEditWisudawanClient initialData={data} prodiList={prodiList} />
    </div>
  );
}
