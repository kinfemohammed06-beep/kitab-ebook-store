import { addToCart } from "@/app/actions";
import { Icon } from "./Icons";

export default function AddToCart({ id, buyNow = false, variant, className = "" }: {
  id: string; buyNow?: boolean; variant?: "outline" | "primary" | "icon"; className?: string;
}) {
  const style = variant ?? (buyNow ? "primary" : "outline");
  return (
    <form action={addToCart} className="inline">
      <input type="hidden" name="id" value={id} />
      {buyNow && <input type="hidden" name="next" value="cart" />}
      {style === "icon" ? (
        <button type="submit" aria-label={buyNow ? "Buy now" : "Add to cart"} title={buyNow ? "Buy now" : "Add to cart"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-forest text-ivory shadow-soft transition hover:-translate-y-0.5 hover:bg-forest-700 hover:shadow-glow">
          <Icon name="cart" className="h-[18px] w-[18px]" />
        </button>
      ) : (
        <button type="submit" className={`btn ${buyNow ? "btn-primary" : "btn-outline"} ${className}`}>
          <Icon name="cart" className="h-4 w-4" />{buyNow ? "Buy now" : "Add to cart"}
        </button>
      )}
    </form>
  );
}
