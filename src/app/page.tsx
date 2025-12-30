import Link from "next/link";
import { STATIC_PATHS } from "@/lib/constants";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Link
        href={STATIC_PATHS.CLIPPERS}
        className="text-2xl font-semibold hover:underline"
      >
        Go to Clippers
      </Link>
    </div>
  );
}
