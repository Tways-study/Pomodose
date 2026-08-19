import { LoginForm } from "@/components/login-form";
import { AddressName } from "@/components/address-term-provider";
import { VialMark } from "@/components/vial-mark";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-6">
          <VialMark />
          <h1 className="font-serif font-medium text-2xl tracking-tight">Pomodose</h1>
        </div>

        <div className="bg-paper border border-line rounded-card p-6 sm:p-8 shadow-[0_1px_0_white_inset,0_8px_26px_-18px_rgba(46,36,51,.10)]">
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-ink-soft">
          Trouble getting in? Use &quot;Forgot password?&quot; on the sign-in form, <AddressName />.
        </p>
      </div>
    </div>
  );
}
