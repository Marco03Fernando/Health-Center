import type { Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => (
  <Card className="hover:shadow-md transition-shadow animate-fade-in">
    <CardContent className="p-5">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center text-xl shrink-0">
          {product.image}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm text-foreground leading-tight">{product.name}</h3>
            {product.prescriptionRequired && (
              <StatusBadge status="prescription_required" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div>
          <span className="font-display font-semibold text-foreground">
            Rs. {product.price.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            {product.stock > 0 ? "In Stock" : "Out of Stock"}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={product.stock === 0}
          onClick={() => onAddToCart(product)}
        >
          <ShoppingCart className="w-3.5 h-3.5 mr-1" />
          Add
        </Button>
      </div>
    </CardContent>
  </Card>
);
