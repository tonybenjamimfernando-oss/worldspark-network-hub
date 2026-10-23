import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity, ArrowRight, BadgePercent, ChartNoAxesCombined, CheckCircle2, CircleDollarSign,
  Compass, CreditCard, Globe2, Heart, LifeBuoy, MapPinned, MessageSquare, Package, Search,
  ShieldCheck, Sparkles, Store, Truck, UserRound, Wallet, Wrench, Zap, Megaphone,
  ClipboardList, Handshake,
} from "lucide-react";
import { meta } from "@/components/InfoPage";

export const Route = createFileRoute("/universo")({
  head: () => meta("Universo GCNM — Salas de comércio global", "Centro modular do GCNM: salas de descoberta, vendas, lojas, pagamentos, logística e gestão."),
  component: UniversePage,
});

const rooms = [
  { title: "Descoberta global", icon: Compass, description: "Encontra oportunidades relevantes em qualquer mercado.", actions: [["Explorar ofertas", "/explorar"], ["Pesquisar produtos", "/explorar?kind=product"], ["Pesquisar serviços", "/explorar?kind=service"], ["Pedidos de compra", "/explorar?kind=request"], ["Oportunidades", "/explorar?kind=opportunity"], ["Categorias", "/explorar"], ["Tendências", "/explorar"], ["Novidades", "/explorar"], ["Ofertas locais", "/mapa"], ["Origem do anúncio", "/regras"]] },
  { title: "Vendas e publicação", icon: Megaphone, description: "Cria anúncios claros e encaminha clientes para a oferta certa.", actions: [["Publicar produto", "/publicar"], ["Publicar serviço", "/publicar"], ["Publicar pedido", "/publicar"], ["Importar por URL", "/publicar"], ["Ver anúncios", "/explorar"], ["Melhorar apresentação", "/publicar"], ["Gerir publicações", "/painel"], ["Criar promoção", "/planos"], ["Acompanhar desempenho", "/painel"], ["Regras de publicação", "/regras"]] },
  { title: "Produtos e catálogo", icon: Package, description: "Organiza produtos, variantes, origem e informação comercial.", actions: [["Catálogo global", "/explorar?kind=product"], ["Novos produtos", "/explorar?kind=product"], ["Mais populares", "/explorar?kind=product"], ["Comparar ofertas", "/explorar"], ["Categorias", "/explorar"], ["Produtos guardados", "/painel"], ["Produtos relacionados", "/explorar"], ["Origem do vendedor", "/regras"], ["Adicionar produto", "/publicar"], ["Gerir catálogo", "/painel"]] },
  { title: "Lojas e empresas", icon: Store, description: "Descobre marcas, fabricantes, distribuidores e lojas.", actions: [["Diretório de empresas", "/empresas"], ["Lojas", "/empresas"], ["Fabricantes", "/empresas"], ["Distribuidores", "/empresas"], ["Perfis empresariais", "/empresas"], ["Criar presença comercial", "/painel"], ["Parcerias", "/freelancers"], ["Contactar vendedor", "/mensagens"], ["Ver no mapa", "/mapa"], ["Planos comerciais", "/planos"]] },
  { title: "Serviços profissionais", icon: Wrench, description: "Liga clientes a prestadores e especialistas.", actions: [["Encontrar serviços", "/explorar?kind=service"], ["Freelancers", "/freelancers"], ["Publicar serviço", "/publicar"], ["Pedidos de serviço", "/explorar?kind=request"], ["Contactar profissional", "/mensagens"], ["Ver perfis", "/freelancers"], ["Serviços próximos", "/mapa"], ["Guardar prestador", "/painel"], ["Regras de contratação", "/regras"], ["Planos profissionais", "/planos"]] },
  { title: "Mapa e território", icon: MapPinned, description: "Explora mercados por país, região e localização disponível.", actions: [["Abrir mapa global", "/mapa"], ["Ofertas próximas", "/mapa"], ["Explorar por país", "/mapa"], ["Explorar por cidade", "/mapa"], ["Ver empresas no mapa", "/mapa"], ["Ver serviços no mapa", "/mapa"], ["Localização do anúncio", "/explorar"], ["Ajustar pesquisa", "/explorar"], ["Cobertura de promoção", "/planos"], ["Privacidade de localização", "/regras"]] },
  { title: "Mensagens e relações", icon: MessageSquare, description: "Centraliza conversas comerciais e contactos.", actions: [["Caixa de mensagens", "/mensagens"], ["Conversas recentes", "/mensagens"], ["Contactar vendedor", "/explorar"], ["Responder a cliente", "/mensagens"], ["Negociar condições", "/mensagens"], ["Partilhar anúncio", "/explorar"], ["Contactos comerciais", "/empresas"], ["Prestadores", "/freelancers"], ["Segurança nas conversas", "/regras"], ["Ajuda", "/centro"]] },
  { title: "Pedidos e encomendas", icon: ClipboardList, description: "Acompanha intenções de compra e organiza o próximo passo.", actions: [["Ver pedidos de compra", "/explorar?kind=request"], ["Criar pedido", "/publicar"], ["Meus pedidos", "/painel"], ["Consultar anúncios", "/explorar"], ["Contactar fornecedor", "/mensagens"], ["Confirmar detalhes", "/mensagens"], ["Guardar fornecedor", "/painel"], ["Acompanhar atividade", "/painel"], ["Regras comerciais", "/regras"], ["Centro de ajuda", "/centro"]] },
  { title: "Pagamentos e carteira", icon: Wallet, description: "Área de preparação financeira e informação sobre métodos suportados.", actions: [["Planos e preços", "/planos"], ["Ver créditos", "/planos"], ["Métodos disponíveis", "/planos"], ["Moeda de referência", "/painel"], ["Histórico da conta", "/painel"], ["Faturação", "/painel"], ["Segurança financeira", "/regras"], ["Política de reembolso", "/regras"], ["Ajuda com pagamentos", "/centro"], ["Contactar suporte", "/mensagens"]] },
  { title: "Moedas e mercados", icon: CircleDollarSign, description: "Prepara a experiência comercial para mercados e moedas diferentes.", actions: [["Ver preços", "/planos"], ["Definir país no perfil", "/painel"], ["Ofertas internacionais", "/explorar"], ["Empresas globais", "/empresas"], ["Serviços internacionais", "/freelancers"], ["Comparar preços", "/explorar"], ["Condições do vendedor", "/explorar"], ["Custos e comissões", "/planos"], ["Suporte comercial", "/centro"], ["Preferências", "/painel"]] },
  { title: "Promoção e marketing", icon: BadgePercent, description: "Apresenta a oferta com foco, confiança e chamada para ação.", actions: [["Planos de promoção", "/planos"], ["Criar anúncio", "/publicar"], ["Destacar oferta", "/planos"], ["Ver ofertas", "/explorar"], ["Criar perfil empresarial", "/painel"], ["Conhecer público", "/centro"], ["Melhorar anúncio", "/publicar"], ["Acompanhar resultados", "/painel"], ["Programa de parceiros", "/planos"], ["Boas práticas", "/regras"]] },
  { title: "Favoritos e listas", icon: Heart, description: "Reúne ofertas e contactos para retomar a decisão mais tarde.", actions: [["Ofertas guardadas", "/painel"], ["Empresas guardadas", "/empresas"], ["Serviços guardados", "/freelancers"], ["Pesquisar novamente", "/explorar"], ["Comparar opções", "/explorar"], ["Ver novidades", "/explorar"], ["Contactar vendedor", "/mensagens"], ["Criar lista", "/painel"], ["Gerir perfil", "/painel"], ["Privacidade", "/regras"]] },
  { title: "Perfis e identidade", icon: UserRound, description: "Mantém a tua presença pessoal ou profissional organizada.", actions: [["O meu perfil", "/painel"], ["Entrar ou registar", "/auth"], ["Perfil empresarial", "/empresas"], ["Perfil profissional", "/freelancers"], ["Editar dados", "/painel"], ["Preferências", "/painel"], ["Segurança da conta", "/regras"], ["Idioma e país", "/painel"], ["Notificações", "/painel"], ["Ajuda de conta", "/centro"]] },
  { title: "Logística e entrega", icon: Truck, description: "Organiza informação de entrega sem prometer integrações inexistentes.", actions: [["Ofertas por localização", "/mapa"], ["Contactar vendedor", "/mensagens"], ["Consultar condições", "/explorar"], ["Ver empresas", "/empresas"], ["Encontrar serviços", "/explorar?kind=service"], ["Criar pedido", "/publicar"], ["Detalhes da oferta", "/explorar"], ["Regras de transação", "/regras"], ["Ajuda logística", "/centro"], ["Planos comerciais", "/planos"]] },
  { title: "Confiança e proteção", icon: ShieldCheck, description: "Consulta regras, origem das ofertas e boas práticas comerciais.", actions: [["Regras da plataforma", "/regras"], ["Origem das ofertas", "/regras"], ["Comprar com cuidado", "/regras"], ["Publicar com transparência", "/regras"], ["Proteção de conta", "/regras"], ["Contactar suporte", "/mensagens"], ["Reportar preocupação", "/centro"], ["Ver empresas", "/empresas"], ["Ver perfil do vendedor", "/explorar"], ["Perguntas frequentes", "/centro"]] },
  { title: "Dados e desempenho", icon: ChartNoAxesCombined, description: "Acompanha a tua atividade onde as funcionalidades já estiverem disponíveis.", actions: [["Painel pessoal", "/painel"], ["Publicações", "/painel"], ["Atividade comercial", "/painel"], ["Planos", "/planos"], ["Ver ofertas", "/explorar"], ["Gerir empresa", "/empresas"], ["Gerir serviços", "/freelancers"], ["Pedidos", "/explorar?kind=request"], ["Centro de comando", "/centro"], ["Ajuda", "/centro"]] },
  { title: "Parceiros e crescimento", icon: Handshake, description: "Encontra colaboradores e caminhos para ampliar a presença comercial.", actions: [["Diretório profissional", "/freelancers"], ["Empresas", "/empresas"], ["Publicar oportunidade", "/publicar"], ["Ver oportunidades", "/explorar?kind=opportunity"], ["Planos comerciais", "/planos"], ["Criar perfil", "/painel"], ["Contactar parceiro", "/mensagens"], ["Descobrir mercados", "/mapa"], ["Regras para parceiros", "/regras"], ["Suporte", "/centro"]] },
  { title: "Notificações e suporte", icon: LifeBuoy, description: "Encontra orientação e retoma as principais tarefas.", actions: [["Centro de comando", "/centro"], ["Mensagens", "/mensagens"], ["Perguntas e regras", "/regras"], ["Planos e cobrança", "/planos"], ["Explorar anúncios", "/explorar"], ["Publicar", "/publicar"], ["Perfil", "/painel"], ["Empresas", "/empresas"], ["Mapa", "/mapa"], ["Contactar equipa", "/mensagens"]] },
];

function UniversePage() {
  return <main className="gcnm-universe min-h-screen px-4 pb-16 pt-8 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-[1500px]">
      <section className="universe-hero relative overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:p-14">
        <div className="universe-orb" aria-hidden="true"><Globe2 size={190} strokeWidth={0.65} /></div>
        <div className="relative z-10 max-w-3xl">
          <span className="universe-kicker"><Sparkles size={14}/> GLOBAL COMMERCE NETWORK MAP</span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">O mundo inteiro.<br/><span className="universe-gold">Um só universo comercial.</span></h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">Uma estrutura modular com salas especializadas para descobrir ofertas, vender, conectar-se, promover negócios e preparar operações globais.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/explorar" className="universe-cta"><Search size={17}/> Explorar ofertas <ArrowRight size={16}/></Link>
            <Link to="/publicar" className="universe-cta universe-cta-gold"><Zap size={17}/> Publicar agora <ArrowRight size={16}/></Link>
          </div>
          <div className="mt-9 grid grid-cols-3 gap-3 sm:max-w-xl">
            {[["17","salas temáticas"],["170+","atalhos organizados"],["24/7","acesso digital"]].map(([value,label])=><div className="universe-stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}
          </div>
        </div>
      </section>
      <div className="my-8 flex flex-wrap items-end justify-between gap-3">
        <div><p className="universe-kicker"><Activity size={14}/> PAINEL DE NAVEGAÇÃO</p><h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Escolhe a tua sala</h2><p className="mt-2 text-sm text-slate-400">Cada sala reúne dez atalhos para áreas e ações existentes no GCNM.</p></div>
        <Link to="/centro" className="universe-text-link">Centro de comando <ArrowRight size={15}/></Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room,index)=>{const Icon=room.icon;return <article className="universe-room" key={room.title}>
          <div className="universe-room-top"><span className="universe-room-icon"><Icon size={21}/></span><span className="universe-room-number">{String(index+1).padStart(2,"0")}</span></div>
          <h3 className="mt-4 text-lg font-bold text-white">{room.title}</h3><p className="mt-2 min-h-10 text-sm leading-6 text-slate-400">{room.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">{room.actions.map(([label,to])=><Link key={label} to={to as never} className="universe-action"><span>{label}</span><ArrowRight size={13}/></Link>)}</div>
          <div className="universe-room-footer"><span><CheckCircle2 size={13}/> Atalhos ligados à plataforma</span><span>10 ações</span></div>
        </article>})}
      </div>
      <section className="universe-payments mt-10 grid gap-6 rounded-3xl p-6 md:grid-cols-[1.2fr_.8fr] md:p-9">
        <div><span className="universe-kicker"><CreditCard size={14}/> EXPERIÊNCIA FINANCEIRA</span><h2 className="mt-3 text-2xl font-bold text-white">Pagamentos preparados para crescer globalmente</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">O GCNM pode apresentar preços por moeda e organizar métodos por país. A cobrança real exige ativação e validação de um fornecedor de pagamentos, moedas suportadas, regras de conversão, segurança e testes — esta área não simula transações nem afirma que todos os meios já estão ligados.</p><div className="mt-5 flex flex-wrap gap-2">{["Moeda por país","Cartões","Carteiras digitais","Pagamentos locais","Comissões transparentes","Registos de cobrança"].map(x=><span className="universe-chip" key={x}>{x}</span>)}</div></div>
        <div className="universe-payment-card"><div className="flex items-center justify-between"><span className="text-sm text-slate-300">Centro financeiro</span><Wallet className="text-amber-300" size={22}/></div><div className="mt-5 text-3xl font-bold text-white">Multi-moeda <span className="text-amber-300">+</span></div><p className="mt-2 text-sm text-slate-400">Preparado para integração de pagamentos por mercado.</p><Link to="/planos" className="universe-cta universe-cta-gold mt-5 w-full">Consultar planos <ArrowRight size={16}/></Link><p className="mt-3 text-xs text-slate-500">Sem cobrança real nesta tela.</p></div>
      </section>
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-slate-500"><span>GCNM · Global Commerce Network Map</span><span>Vidro, luz e dourado — uma assinatura de confiança.</span><Link to="/regras" className="universe-text-link">Regras e transparência <ArrowRight size={13}/></Link></footer>
    </div>
  </main>;
}
