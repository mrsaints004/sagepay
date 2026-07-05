import { PaymentPage } from "@/components/pay/PaymentPage";

interface PayPageProps {
  params: Promise<{ id: string }>;
}

export default async function PayPage({ params }: PayPageProps) {
  const { id } = await params;
  return <PaymentPage linkId={id} />;
}
