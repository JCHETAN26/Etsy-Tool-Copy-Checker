import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "How does the image detection work?", a: "We use perceptual hashing (pHash) to create a digital fingerprint of your product photos. This fingerprint is compared against other Etsy listings — catching copies even if they've been resized, cropped, or color-adjusted." },
  { q: "Will this work with my existing Etsy shop?", a: "Yes! Just connect your shop via Etsy's official OAuth. We import all your active listings automatically — no manual entry needed." },
  { q: "What happens when a copy is detected?", a: "You'll receive an email alert with the match details. From your dashboard, you can view the suspected copy side-by-side with your listing, report it to Etsy with a pre-filled form, or dismiss it." },
  { q: "How accurate is it?", a: "Our detection uses a combination of fuzzy title matching and perceptual image hashing, which is highly accurate. We show you a similarity percentage so you can decide how to act." },
  { q: "Can I cancel anytime?", a: "Absolutely. No contracts, no commitments. Cancel from your billing settings and you won't be charged again." },
  { q: "Does ListingShield violate Etsy's terms of service?", a: "No. We use Etsy's official API with read-only access. We never modify your shop, listings, or account in any way." },
];

export function FAQSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
