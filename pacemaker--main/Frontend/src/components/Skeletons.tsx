'use client';

import React from 'react';

// Reusable Pulse Shimmer element
export function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className || 'h-4 w-full'}`} />
  );
}

// 1. Dashboard Skeleton (Stats cards, quick actions, activity feed)
export function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <Shimmer className="h-8 w-64" />
          <Shimmer className="h-4 w-96" />
        </div>
        <Shimmer className="h-12 w-40 rounded-2xl" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-gray-150 p-6 rounded-[2rem] space-y-4">
            <div className="flex justify-between items-center">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-8 w-8 rounded-full" />
            </div>
            <Shimmer className="h-8 w-16" />
            <Shimmer className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Quick Actions & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-150 p-8 rounded-[2.5rem] space-y-6">
            <Shimmer className="h-6 w-48" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-gray-100 p-4 rounded-2xl flex flex-col items-center gap-3">
                  <Shimmer className="h-10 w-10 rounded-xl" />
                  <Shimmer className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed list */}
          <div className="bg-white border border-gray-150 p-8 rounded-[2.5rem] space-y-6">
            <Shimmer className="h-6 w-40" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Shimmer className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Shimmer className="h-4 w-1/2" />
                    <Shimmer className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-150 p-8 rounded-[2.5rem] space-y-4">
            <Shimmer className="h-6 w-32" />
            <Shimmer className="h-48 w-full rounded-2xl" />
            <Shimmer className="h-4 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. Video Player Skeleton (Player box, title, description, comments)
export function VideoPlayerSkeleton() {
  return (
    <div className="space-y-8">
      {/* Video Box Placeholder */}
      <div className="aspect-video bg-gray-200 rounded-[2.5rem] animate-pulse flex items-center justify-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
          <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-gray-400 border-b-8 border-b-transparent ml-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Title, description, resources */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-150 p-8 rounded-[2.5rem] space-y-4">
            <Shimmer className="h-7 w-3/4" />
            <div className="flex gap-4">
              <Shimmer className="h-4 w-20" />
              <Shimmer className="h-4 w-24" />
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <Shimmer className="h-4 w-full" />
              <Shimmer className="h-4 w-full" />
              <Shimmer className="h-4 w-2/3" />
            </div>
          </div>

          {/* Comments section skeleton */}
          <div className="bg-white border border-gray-150 p-8 rounded-[2.5rem] space-y-6">
            <Shimmer className="h-6 w-32" />
            <div className="flex gap-3">
              <Shimmer className="h-10 w-10 rounded-full shrink-0" />
              <Shimmer className="h-12 flex-1 rounded-xl" />
            </div>
            <div className="space-y-4 pt-4 border-t border-gray-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Shimmer className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Shimmer className="h-4 w-1/3" />
                    <Shimmer className="h-3 w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar list */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-150 p-6 rounded-[2.5rem] space-y-4">
            <Shimmer className="h-5 w-40" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 items-center">
                <Shimmer className="h-12 w-20 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1">
                  <Shimmer className="h-3.5 w-full" />
                  <Shimmer className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. Study Material Grid Skeleton (3-4 column card grid)
export function StudyMaterialGridSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header controls skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Shimmer className="h-8 w-48" />
          <Shimmer className="h-4 w-80" />
        </div>
        <div className="flex gap-3">
          <Shimmer className="h-10 w-32 rounded-xl" />
          <Shimmer className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      {/* Grid wrapper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-gray-150 rounded-[2rem] overflow-hidden flex flex-col">
            <Shimmer className="aspect-video rounded-none w-full" />
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <Shimmer className="h-3.5 w-20" />
                <Shimmer className="h-5 w-3/4" />
                <Shimmer className="h-3 w-full" />
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex justify-between">
                  <Shimmer className="h-3 w-16" />
                  <Shimmer className="h-3 w-12" />
                </div>
                <div className="flex gap-2">
                  <Shimmer className="h-10 flex-1 rounded-xl" />
                  <Shimmer className="h-10 w-10 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Admin Tables Skeleton (Header row + 5-10 data rows)
export function AdminTableSkeleton() {
  return (
    <div className="bg-white border border-gray-250 rounded-[2.5rem] p-8 shadow-sm space-y-6">
      {/* Search & Actions */}
      <div className="flex justify-between items-center border-b pb-6 border-gray-100">
        <Shimmer className="h-10 w-64 rounded-xl" />
        <Shimmer className="h-10 w-36 rounded-xl" />
      </div>

      {/* Table grid */}
      <div className="space-y-4">
        {/* Table header row */}
        <div className="grid grid-cols-6 gap-4 py-3 bg-gray-50 rounded-xl px-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Shimmer key={i} className="h-3.5 w-16" />
          ))}
        </div>

        {/* Table body rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
          <div key={row} className="grid grid-cols-6 gap-4 py-4 border-b border-gray-50 px-4 items-center">
            <Shimmer className="h-4 w-8" />
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-6 w-16 rounded-full" />
            <div className="flex gap-1.5">
              <Shimmer className="h-8 w-8 rounded-lg" />
              <Shimmer className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Course Grid Skeleton (Thumbnails, titles, buttons)
export function CourseGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white border border-gray-200 p-8 rounded-3xl space-y-6">
          <Shimmer className="w-16 h-16 rounded-2xl" />
          <div className="space-y-3">
            <Shimmer className="h-6 w-2/3" />
            <Shimmer className="h-3.5 w-full" />
            <Shimmer className="h-3.5 w-5/6" />
          </div>
          <Shimmer className="h-4 w-24 pt-4" />
        </div>
      ))}
    </div>
  );
}

// 6. Live Classes Skeleton (Class cards with date/time)
export function LiveClassesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-gray-150 rounded-[2rem] p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Shimmer className="h-5 w-20 rounded-full" />
            <Shimmer className="h-4 w-24" />
          </div>
          <Shimmer className="h-6 w-3/4" />
          <Shimmer className="h-3 w-40" />
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <Shimmer className="h-8 w-8 rounded-full" />
              <Shimmer className="h-3.5 w-24" />
            </div>
            <Shimmer className="h-10 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 7. Profile Page Skeleton (Avatar, form fields)
export function ProfilePageSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 md:p-12 max-w-3xl mx-auto space-y-8">
      {/* Header Profile Block */}
      <div className="flex items-center gap-6">
        <Shimmer className="w-20 h-20 rounded-full shrink-0" />
        <div className="space-y-2">
          <Shimmer className="h-5 w-40" />
          <Shimmer className="h-3 w-28" />
        </div>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <Shimmer className="h-3.5 w-24" />
            <Shimmer className="h-12 w-full rounded-2xl" />
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div className="pt-6 border-t border-gray-100 flex justify-end">
        <Shimmer className="h-12 w-32 rounded-xl" />
      </div>
    </div>
  );
}
