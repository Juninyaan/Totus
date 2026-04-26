import type { ReactNode } from "react";

type ShopWorkspaceSectionProps = {
  shopCard: ReactNode;
  productCard: ReactNode;
  productsCard: ReactNode;
  venueOfferCard: ReactNode;
  venueOffersCard: ReactNode;
  requestsCard: ReactNode;
};

export function ShopWorkspaceSection({ shopCard, productCard, productsCard, venueOfferCard, venueOffersCard, requestsCard }: ShopWorkspaceSectionProps) {
  return (
    <section className="sport-entrance grid gap-5" id="shop-hub">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Shop corner</p>
        <h3 className="mt-3 text-2xl font-bold uppercase tracking-[0.06em] text-accent-deep">Venue offers, access requests, and storefront details</h3>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">Gym owners can publish memberships, day entry, classes, and events from the same workspace that handles booking requests and shop products.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div id="shop-profile">{shopCard}</div>
        <div id="shop-products">{productCard}</div>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div id="shop-venue-offer">{venueOfferCard}</div>
        <div id="shop-requests">{requestsCard}</div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div id="shop-inventory">{productsCard}</div>
        <div id="shop-venue-offers">{venueOffersCard}</div>
      </div>
    </section>
  );
}