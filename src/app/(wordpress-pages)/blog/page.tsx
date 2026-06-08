import Link from "next/link";
import Image from "next/image";
import { fetchPosts } from "@/lib/wp";

export const metadata = {
  title: "Blog — NextPress Quickstart",
  description: "Posts pulled live from WordPress over WPGraphQL, rendered with Next.js.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogIndex() {
  const posts = await fetchPosts(20);
  const countLabel = `${posts.length} ${posts.length === 1 ? "post" : "posts"}`;

  return (
    <>
      <header className="relative overflow-hidden bg-contrast bg-hero-bloom text-base py-x-large px-x-small">
        <div className="mx-auto w-full max-w-wide relative">
          <p className="inline-flex items-center gap-3 text-x-small font-semibold tracking-[0.25em] uppercase text-primary mb-5 before:content-[''] before:w-8 before:h-px before:bg-primary">
            Index // archive
          </p>
          <h1 className="text-max-72 font-black leading-[0.95] tracking-[-0.045em] max-w-headline">
            Blog
          </h1>
          <div className="mt-medium flex flex-wrap gap-x-small text-x-small tracking-[0.15em] uppercase text-base/50">
            <span className="text-base font-semibold">{countLabel}</span>
            <span>pulled live from wordpress</span>
          </div>
        </div>
      </header>

      <section className="flex-1 mx-auto w-full max-w-content px-x-small py-medium">
        {posts.length === 0 ? (
          <p className="text-large">No posts yet.</p>
        ) : (
          <ul className="flex flex-col gap-small">
            {posts.map((post) => (
              <li key={post.slug} className="border-b border-neutral pb-small">
                {post.featuredImage && (
                  <Link href={`/blog/${post.slug}`} className="block mb-x-small">
                    <Image
                      src={post.featuredImage.sourceUrl}
                      alt={post.featuredImage.altText || post.title}
                      width={1200}
                      height={630}
                      sizes="(min-width: 1024px) 640px, 100vw"
                      className="w-full h-auto rounded"
                    />
                  </Link>
                )}
                <p className="text-small text-contrast/60 uppercase tracking-wide">
                  {formatDate(post.date)}
                </p>
                <h2 className="text-x-large font-semibold mt-1">
                  <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt && (
                  <div
                    className="mt-2 text-medium text-contrast/80"
                    dangerouslySetInnerHTML={{ __html: post.excerpt }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
