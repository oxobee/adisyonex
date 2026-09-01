import { LottieLoader } from "@/components/shared/lottie-loader";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[60svh] w-full items-center justify-center p-6 animate-in fade-in-50 duration-200">
      <LottieLoader size="md" text="Yönetici Paneli Yükleniyor…" className="p-0" />
    </div>
  );
}
