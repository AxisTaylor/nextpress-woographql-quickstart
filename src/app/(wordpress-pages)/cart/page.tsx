import { notFound } from "next/navigation";
import { Content, nextImageParser } from "@axistaylor/nextpress";
import { fetchPageByUri } from "@/lib/wp";

export const metadata = {
  title: "Cart — NextPress + WooGraphQL",
};

export default async function CartPage() {
  const page = await fetchPageByUri("/cart/");
  if (!page) notFound();

  return (
    <article className="flex-1 mx-auto w-full max-w-content px-x-small py-medium">
      <Content
        content={page.content}
        contentCssClasses={page.contentCssClasses}
        parsers={[nextImageParser()]}
      />
    </article>
  );
}
