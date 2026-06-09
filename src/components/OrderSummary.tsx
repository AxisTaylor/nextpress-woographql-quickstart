import type { Order } from "@/lib/wp";

interface OrderSummaryProps {
  order: Order;
  headline?: string;
  intro?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pending payment",
    PROCESSING: "Processing",
    ON_HOLD: "On hold",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
    FAILED: "Failed",
    CHECKOUT_DRAFT: "Checkout draft",
  };
  return map[status] ?? status;
}

function statusTone(status: string): string {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-800 border-yellow-200",
    PROCESSING: "bg-blue-50 text-blue-800 border-blue-200",
    ON_HOLD: "bg-orange-50 text-orange-800 border-orange-200",
    COMPLETED: "bg-green-50 text-green-800 border-green-200",
    CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
    REFUNDED: "bg-purple-50 text-purple-800 border-purple-200",
    FAILED: "bg-red-50 text-red-800 border-red-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

export function OrderSummary({ order, headline, intro }: OrderSummaryProps) {
  return (
    <article className="flex flex-col gap-medium">
      {headline && (
        <header className="flex flex-col gap-2">
          <h1 className="text-max-72 font-black leading-[0.95] tracking-[-0.045em]">{headline}</h1>
          {intro && <p className="text-medium text-contrast/75">{intro}</p>}
        </header>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 bg-neutral border border-contrast/10 p-medium">
        <div className="flex flex-col gap-1">
          <p className="text-x-small uppercase tracking-[0.2em] text-contrast/55">Order</p>
          <h2 className="text-x-large font-semibold">#{order.orderNumber}</h2>
          <p className="text-small text-contrast/70">{formatDate(order.date)}</p>
        </div>
        <span
          className={`px-3 py-1 text-x-small uppercase tracking-[0.15em] font-semibold border ${statusTone(order.status)}`}
        >
          {statusLabel(order.status)}
        </span>
      </div>

      <section className="grid md:grid-cols-2 gap-medium">
        <div className="bg-base border border-contrast/10 p-medium flex flex-col gap-2">
          <h3 className="text-x-small uppercase tracking-[0.2em] font-semibold text-contrast/65">Billing</h3>
          <address className="not-italic text-medium text-contrast/85 leading-relaxed">
            {order.billing.firstName} {order.billing.lastName}<br />
            {order.billing.company && <>{order.billing.company}<br /></>}
            {order.billing.address1}<br />
            {order.billing.address2 && <>{order.billing.address2}<br /></>}
            {order.billing.city}{order.billing.city && order.billing.state ? ", " : ""}{order.billing.state} {order.billing.postcode}<br />
            {order.billing.country}
            {order.billing.email && <><br /><span className="text-contrast/65">{order.billing.email}</span></>}
            {order.billing.phone && <><br /><span className="text-contrast/65">{order.billing.phone}</span></>}
          </address>
        </div>

        <div className="bg-base border border-contrast/10 p-medium flex flex-col gap-2">
          <h3 className="text-x-small uppercase tracking-[0.2em] font-semibold text-contrast/65">Shipping</h3>
          <address className="not-italic text-medium text-contrast/85 leading-relaxed">
            {order.shipping.firstName} {order.shipping.lastName}<br />
            {order.shipping.company && <>{order.shipping.company}<br /></>}
            {order.shipping.address1}<br />
            {order.shipping.address2 && <>{order.shipping.address2}<br /></>}
            {order.shipping.city}{order.shipping.city && order.shipping.state ? ", " : ""}{order.shipping.state} {order.shipping.postcode}<br />
            {order.shipping.country}
          </address>
        </div>
      </section>

      <section className="bg-base border border-contrast/10">
        <h3 className="text-x-small uppercase tracking-[0.2em] font-semibold text-contrast/65 px-medium pt-medium pb-3">
          Items
        </h3>
        <ul className="divide-y divide-contrast/10">
          {order.lineItems.nodes.map((item, i) => {
            const product = item.product?.node;
            const variation = item.variation?.node;
            const image = variation?.image || product?.image;
            const name = variation?.name || product?.name || "Product";
            return (
              <li key={i} className="flex items-center gap-x-small p-medium">
                {image?.sourceUrl ? (
                  // Plain <img> (server-rendered, no Next.js Image required here)
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.sourceUrl}
                    alt={image.altText || name}
                    className="w-16 h-16 object-cover bg-neutral"
                  />
                ) : (
                  <div className="w-16 h-16 bg-neutral" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{name}</p>
                  <p className="text-small text-contrast/65">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold" dangerouslySetInnerHTML={{ __html: item.total }} />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bg-base border border-contrast/10 p-medium">
        <h3 className="text-x-small uppercase tracking-[0.2em] font-semibold text-contrast/65 mb-3">Totals</h3>
        <dl className="flex flex-col gap-2 text-medium">
          <div className="flex justify-between">
            <dt className="text-contrast/70">Subtotal</dt>
            <dd dangerouslySetInnerHTML={{ __html: order.subtotal }} />
          </div>
          {order.shippingLines.nodes.map((line, i) => (
            <div key={`s${i}`} className="flex justify-between">
              <dt className="text-contrast/70">{line.methodTitle}</dt>
              <dd dangerouslySetInnerHTML={{ __html: line.total }} />
            </div>
          ))}
          {order.feeLines.nodes.map((line, i) => (
            <div key={`f${i}`} className="flex justify-between">
              <dt className="text-contrast/70">{line.name}</dt>
              <dd dangerouslySetInnerHTML={{ __html: line.total }} />
            </div>
          ))}
          {order.taxLines.nodes.map((line, i) => (
            <div key={`t${i}`} className="flex justify-between">
              <dt className="text-contrast/70">{line.label}</dt>
              <dd dangerouslySetInnerHTML={{ __html: line.taxTotal }} />
            </div>
          ))}
          {order.discountTotal && order.discountTotal !== "$0.00" && (
            <div className="flex justify-between text-green-700">
              <dt>Discount</dt>
              <dd>−<span dangerouslySetInnerHTML={{ __html: order.discountTotal }} /></dd>
            </div>
          )}
          <div className="flex justify-between border-t border-contrast/10 pt-3 mt-1 text-large font-semibold">
            <dt>Total</dt>
            <dd dangerouslySetInnerHTML={{ __html: order.total }} />
          </div>
        </dl>
        {order.paymentMethodTitle && (
          <p className="mt-medium text-small text-contrast/70">
            <span className="font-semibold">Payment:</span> {order.paymentMethodTitle}
          </p>
        )}
      </section>

      {order.customerNote && (
        <section className="bg-base border border-contrast/10 p-medium">
          <h3 className="text-x-small uppercase tracking-[0.2em] font-semibold text-contrast/65 mb-2">Note</h3>
          <p className="text-medium text-contrast/85">{order.customerNote}</p>
        </section>
      )}
    </article>
  );
}
