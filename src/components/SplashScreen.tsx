export default function SplashScreen() {
  return (
    <div className="app-chrome flex h-dvh flex-col items-center justify-center gap-4 bg-brand text-white dark:bg-background">
      <span className="text-6xl" aria-hidden>
        👥
      </span>
      <p className="text-xl font-bold tracking-wide">Community</p>
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/25">
        <span className="block h-full w-1/2 animate-pulse rounded-full bg-white" />
      </span>
    </div>
  );
}
