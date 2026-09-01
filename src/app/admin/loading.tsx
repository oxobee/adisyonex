import { LottieLoader } from "@/components/shared/lottie-loader";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[60svh] w-full items-center justify-center p-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col items-center justify-center rounded-3xl bg-card/85 p-6 sm:p-8 shadow-2xl border border-primary/20 backdrop-blur-xl animate-in zoom-in-95 duration-200">
        <LottieLoader size="md" text="Yönetici Paneli Yükleniyor…" className="p-0" />
      </div>
    </div>
  );
}
