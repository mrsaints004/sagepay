import type { Metadata } from "next";
import { PaymentPage } from "@/components/pay/PaymentPage";
import { getLink } from "@/lib/db";

interface PayPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PayPageProps): Promise<Metadata> {
  const { id } = await params;
  const link = await getLink(id);

  if (!link) {
    return { title: "Payment Not Found" };
  }

  const title = `Pay $${link.amount.toFixed(2)} ${link.token}`;
  const description = link.memo
    ? `Payment request: "${link.memo}" — Pay from any chain via SagePay`
    : `Payment request for $${link.amount.toFixed(2)} ${link.token} — Pay from any chain via SagePay`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function PayPage({ params }: PayPageProps) {
  const { id } = await params;
  return <PaymentPage linkId={id} />;
}
