import { notFound } from "next/navigation";
import { Content, nextImageParser } from "@axistaylor/nextpress";
import { fetchPostBySlug, fetchPostSlugs } from "@/lib/wp";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await fetchPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return { title: `${post.title} — NextPress Quickstart` };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <header className="relative overflow-hidden bg-contrast bg-hero-bloom text-base py-x-large px-x-small">
        <div className="mx-auto w-full max-w-wide relative">
          <p className="inline-flex items-center gap-3 text-x-small font-semibold tracking-[0.25em] uppercase text-primary mb-5 before:content-[''] before:w-8 before:h-px before:bg-primary">
            Post // headless
          </p>
          <h1 className="text-max-72 font-black leading-[0.95] tracking-[-0.045em] max-w-headline">
            {post.title}
          </h1>
          <div className="mt-medium flex flex-wrap gap-x-small text-x-small tracking-[0.15em] uppercase text-base/50">
            <span className="text-base font-semibold">{formatDate(post.date)}</span>
            <span>nextpress quickstart</span>
          </div>
        </div>
      </header>

      <article className="flex-1 mx-auto w-full max-w-content px-x-small py-medium">
        <Content
          content={post.content}
          contentCssClasses={post.contentCssClasses}
          parsers={[nextImageParser()]}
        />
      </article>
    </>
  );
}
