import Link from "next/link";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export default function HomePage() {
  return (
    <main className="space-y-8 py-6 md:py-8">
      <section className="relative flex min-h-[72vh] flex-col items-center justify-center overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-b from-[#0f0f0f] via-black to-[#0f0f0f] px-4 py-10 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.16),transparent_52%)]" />

        <div className="relative z-10 flex max-w-3xl flex-col items-center justify-center gap-6">
          <h1 className="text-5xl font-bold tracking-tight text-white">Welcome to SaksGram</h1>
          <p className="text-xl font-medium text-gray-200">Share your world. Connect instantly.</p>
          <p className="max-w-2xl text-base text-gray-400">
            Post moments, follow people, and interact in a modern social experience.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button className="w-full bg-yellow-400 px-6 text-black hover:bg-yellow-300">Create Account</Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full bg-yellow-400 px-6 text-black hover:bg-yellow-300">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto mt-20 px-6">
        <div className="space-y-2 text-center">
          <h2 className="text-white text-2xl font-bold">Features</h2>
          <p className="text-sm text-gray-400">Everything you need for a modern social experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {[
            {
              title: "Post Content",
              description: "Share your moments with images and text.",
            },
            {
              title: "Follow Users",
              description: "Discover people and build your community.",
            },
            {
              title: "Like & Comment",
              description: "Engage with posts through reactions and comments.",
            },
            {
              title: "Real-time Interaction",
              description: "Stay connected with updates as they happen.",
            },
          ].map((feature) => (
            <Card
              key={feature.title}
              className="bg-[#111111] p-6 rounded-xl border border-gray-800 flex flex-col gap-3 items-start justify-start"
            >
              <h3 className="text-white text-lg font-semibold whitespace-normal break-words">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
