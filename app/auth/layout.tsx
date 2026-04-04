export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background">{children}</div>;
}
