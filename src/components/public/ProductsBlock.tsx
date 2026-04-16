"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  url: string;
  title: string;
  image: string;
}

interface ProductsBlockProps {
  layout?: string;
  products?: Product[];
  onTrackClick?: (url: string, title: string) => void;
}

export function ProductsBlock({ layout = "grid", products = [], onTrackClick }: ProductsBlockProps) {
  if (!products.length) return null;

  return (
    <div className="w-full">
      {/* Grid Layout */}
      {layout === "grid" && (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} className="flex-col" onTrackClick={onTrackClick} />
          ))}
        </div>
      )}

      {/* Large Card Layout */}
      {layout === "large_card" && (
        <div className="flex flex-col gap-4">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} className="flex-col" sizes="(max-width: 768px) 100vw, 400px" onTrackClick={onTrackClick} />
          ))}
        </div>
      )}

      {/* Carousel Layout */}
      {layout === "carousel" && (
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2 -mx-4 px-4">
          {products.map((product, i) => (
            <div key={product.id} className="min-w-[70%] max-w-[280px] shrink-0 snap-center">
              <ProductCard product={product} index={i} className="flex-col h-full" onTrackClick={onTrackClick} />
            </div>
          ))}
        </div>
      )}

      {/* Alternating Layout */}
      {layout === "alternating" && (
        <div className="flex flex-col gap-3">
          {products.map((product, i) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              index={i} 
              className={i % 2 === 0 ? "flex-row" : "flex-row-reverse"} 
              imgClassName="w-1/3 aspect-square"
              onTrackClick={onTrackClick}
            />
          ))}
        </div>
      )}

      {/* Text Left Layout */}
      {layout === "text_left" && (
        <div className="flex flex-col gap-3">
          {products.map((product, i) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              index={i} 
              className="flex-row-reverse" 
              imgClassName="w-1/3 aspect-[4/3]"
              onTrackClick={onTrackClick}
            />
          ))}
        </div>
      )}

      {/* Text Right Layout */}
      {layout === "text_right" && (
        <div className="flex flex-col gap-3">
          {products.map((product, i) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              index={i} 
              className="flex-row" 
              imgClassName="w-1/3 aspect-[4/3]"
              onTrackClick={onTrackClick}
            />
          ))}
        </div>
      )}

      {/* Story Layout */}
      {layout === "story" && (
        <div className="flex flex-col gap-4">
          {products.map((product, i) => (
            <a
              key={product.id}
              href={product.url}
              onClick={(e) => {
                if (onTrackClick) onTrackClick(product.url, product.title);
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative w-full aspect-[3/4] rounded-[var(--radius-lg)] overflow-hidden group shadow-md"
            >
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
              ) : (
                <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-white font-bold text-lg leading-tight mb-2">{product.title}</h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white">
                  Ver producto <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  index: number;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  onTrackClick?: (url: string, title: string) => void;
}

function ProductCard({ product, index, className = "", imgClassName = "aspect-[4/3]", sizes, onTrackClick }: ProductCardProps) {
  return (
    <motion.a
      href={product.url}
      onClick={(e) => {
        if (onTrackClick) onTrackClick(product.url, product.title);
      }}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass flex rounded-[var(--radius-lg)] overflow-hidden shadow-sm hover:shadow-md transition-all group ${className}`}
    >
      <div className={`relative shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800 ${imgClassName}`}>
        {product.image ? (
          // Use img tag because these are external unoptimized images that could fail Next.js strict remote patterns
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ExternalLink className="w-6 h-6 text-neutral-400" />
          </div>
        )}
      </div>
      
      <div className="p-3 flex-1 flex flex-col justify-center min-w-0">
        <h3 className="font-semibold text-[var(--text-primary)] text-sm line-clamp-2 leading-snug">
          {product.title}
        </h3>
      </div>
    </motion.a>
  );
}
