export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Family Donation Platform
        </h1>
        <p className="text-center text-lg mb-8">
          Supporting families through monthly contributions
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/auth/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Sign In
          </a>
          <a
            href="/auth/register"
            className="px-6 py-3 bg-white text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition"
          >
            Register
          </a>
        </div>
      </div>
    </main>
  )
}
