import VisaBuilder from "@/components/VisaBuilder";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default function HomePage() {
  const cloudinaryReady = isCloudinaryConfigured();
  return <VisaBuilder cloudinaryReady={cloudinaryReady} />;
}
