import { NextRequest, NextResponse } from "next/server";
import { gqlWithSession } from "@/lib/wp";
import { cookies } from "next/headers";

interface ReviewPayload {
  productId: number;
  rating: number;
  content: string;
  name?: string;
  email?: string;
  userId?: number;
}

function isValidRating(rating: unknown): rating is number {
  return typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as ReviewPayload | null;

  if (!payload || !payload.productId || !isValidRating(payload.rating) || !payload.content?.trim()) {
    return NextResponse.json({ error: "Missing or invalid review fields." }, { status: 400 });
  }

  const isGuest = !payload.userId;
  if (isGuest && (!payload.name?.trim() || !payload.email?.trim())) {
    return NextResponse.json({ error: "Name and email are required for guest reviews." }, { status: 400 });
  }

  const c = await cookies();
  const authToken = c.get("authToken")?.value ?? null;
  const sessionToken = c.get("sessionToken")?.value ?? null;

  const input: Record<string, unknown> = {
    commentOn: payload.productId,
    rating: payload.rating,
    content: payload.content.trim(),
  };
  if (isGuest) {
    input.author = payload.name?.trim();
    input.authorEmail = payload.email?.trim();
  } else {
    input.userId = payload.userId;
  }

  const result = await gqlWithSession<{ writeReview: {
    rating: number | null;
    review: { id: string; databaseId: number; date: string; content: string; author: { node: { name: string } } | null } | null;
  } | null }>(
    `mutation WriteReview($input: WriteReviewInput!) {
      writeReview(input: $input) {
        rating
        review {
          id
          databaseId
          date
          content
          author { node { name } }
        }
      }
    }`,
    { input },
    { authToken, sessionToken },
  );

  if (result.errors?.length) {
    return NextResponse.json({ error: result.errors[0].message }, { status: 400 });
  }

  const review = result.data?.writeReview?.review;
  if (!review) {
    return NextResponse.json({ error: "Review could not be created." }, { status: 500 });
  }

  return NextResponse.json({
    review: {
      ...review,
      rating: result.data?.writeReview?.rating ?? payload.rating,
    },
  });
}
