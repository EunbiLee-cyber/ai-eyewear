import { assets } from "../config/assets";
import { content } from "../config/content";

export function ProductPanel() {
  const { productHeadline, productCta, productAlt } = content.ending;
  return (
    <section className="product" data-scene="product">
      <div className="product-copy">
        <h2 className="product-headline">{productHeadline}</h2>
        {/* 콘셉트 CTA — 기능 없는 시각 요소(링크·버튼 아님) */}
        <span className="product-cta">
          {productCta}
          <svg viewBox="0 0 11 24" aria-hidden="true">
            <path d="M3 5l7 7-7 7" />
          </svg>
        </span>
      </div>
      <div className="product-visual">
        <img src={assets.product.image} alt={productAlt} draggable={false} />
      </div>
    </section>
  );
}
