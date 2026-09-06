import { PageHeroSkeleton, SkeletonGrid } from "@/components/site/skeleton";

export default function Loading() {
  return (
    <>
      <PageHeroSkeleton />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div className="mb-6 h-10" />
        <SkeletonGrid count={15} />
      </div>
    </>
  );
}
