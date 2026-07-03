import { redirect } from "next/navigation";
import { getDefaultConfluenceSlug } from "@/lib/confluence/catalog";

export default function ConfluenceIndexPage() {
  redirect(`/confluence/${getDefaultConfluenceSlug()}`);
}
