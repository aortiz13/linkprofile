import type { Metadata } from "next";
import A2Client from "./A2Client";
import FunnelViewTracker from "../FunnelViewTracker";

export const metadata: Metadata = {
  title: "Domina Claude · Workshop EN VIVO · USD $17",
  description: "Pagás Claude Pro y solo usás el 1%? Te muestro el otro 99%. Workshop 100% EN VIVO · Sábado 16 May · 10am ARG · USD $17.",
};

export default function A2Page() {
  return (
    <>
      <FunnelViewTracker funnelSlug="a" variantKey="2" />
      <A2Client />
    </>
  );
}
