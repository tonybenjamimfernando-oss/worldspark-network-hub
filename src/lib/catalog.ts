import {
  Tv, Laptop, Smartphone, Sofa, Shirt, Sparkles, Apple, Wheat, Hammer, Car, Building2,
  GraduationCap, Cpu, Truck, Wrench, Briefcase, Package, type LucideIcon,
} from "lucide-react";

export const CATEGORIES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "electronics", label: "Eletrónica", icon: Tv },
  { id: "computing", label: "Informática", icon: Laptop },
  { id: "phones", label: "Telemóveis", icon: Smartphone },
  { id: "home", label: "Casa e mobiliário", icon: Sofa },
  { id: "fashion", label: "Vestuário", icon: Shirt },
  { id: "beauty", label: "Beleza e cuidados", icon: Sparkles },
  { id: "food", label: "Alimentação", icon: Apple },
  { id: "agriculture", label: "Agricultura", icon: Wheat },
  { id: "construction", label: "Materiais de construção", icon: Hammer },
  { id: "vehicles", label: "Veículos", icon: Car },
  { id: "realestate", label: "Imobiliário", icon: Building2 },
  { id: "education", label: "Educação", icon: GraduationCap },
  { id: "technology", label: "Tecnologia", icon: Cpu },
  { id: "transport", label: "Transporte", icon: Truck },
  { id: "repairs", label: "Reparações", icon: Wrench },
  { id: "professional", label: "Serviços profissionais", icon: Briefcase },
  { id: "other", label: "Outros", icon: Package },
];

export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? "Outros";

export const KINDS = {
  product: "Produto",
  service: "Serviço",
  request: "Pedido de compra",
  opportunity: "Oportunidade",
} as const;
export type Kind = keyof typeof KINDS;

export const CURRENCIES = ["EUR", "USD", "MZN", "BRL", "AOA", "ZAR", "GBP", "CVE"];

export const CONDITIONS = ["Novo", "Usado – como novo", "Usado – bom", "Usado – aceitável", "Recondicionado"];

export const ACCOUNT_TYPES = {
  personal: "Pessoal",
  business: "Empresa",
  provider: "Prestador de serviços",
} as const;

export function formatPrice(price: number | null, currency: string) {
  if (price == null) return "Preço sob consulta";
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}
