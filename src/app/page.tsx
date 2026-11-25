import VisaBuilder from "@/components/VisaBuilder";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const cloudinaryReady = isCloudinaryConfigured();
  return <VisaBuilder cloudinaryReady={cloudinaryReady} />;
}
