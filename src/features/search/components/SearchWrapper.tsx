import { getContentBatch } from "@/src/lib/content";
import SearchManager from "./SearchManager";

export default async function SearchWrapper() {
  const content = await getContentBatch([
    'search.city_label',
    'search.street_label', 
    'search.number_label',
    'search.button',
  ]);

  return <SearchManager content={content} />;
}