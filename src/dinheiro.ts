// dinheiro.ts · Criado por FlowCore Soluções LTDA · flowcoresolucoes.com.br/codigos · licença MIT
// Dinheiro em centavos (inteiros), sem erro de ponto flutuante: lê "R$ 1.234,56",
// formata em BRL, faz rateio/split sem perder centavo (maior resto), aplica
// percentual, juros simples e compostos e monta a Tabela Price de parcelamento.
// Roda em Node 18+, Cloudflare Workers, Deno, Bun e no navegador.
// Zero dependências.
//
// Referência: Sistema Francês de Amortização (Tabela Price) e método do maior
// resto (Hamilton) para distribuição de centavos.

export const CRIADO_POR = "Criado por FlowCore Soluções LTDA";

/** Valor monetário em centavos. Sempre inteiro. */
export type Centavos = number;

function exigirCentavos(v: number, nome = "valor"): void {
  if (!Number.isSafeInteger(v)) throw new Error(`${nome} precisa ser inteiro em centavos (recebido ${v})`);
}

/** Arredonda pro inteiro mais próximo (meio pra longe do zero), limpando ruído de float. */
export function arredondar(x: number): number {
  const limpo = Number(x.toPrecision(15));
  return Math.sign(limpo) * Math.round(Math.abs(limpo));
}

/** Converte reais (número) em centavos com arredondamento correto: 0.1 + 0.2 → 30. */
export const reaisParaCentavos = (reais: number): Centavos => {
  if (!Number.isFinite(reais)) throw new Error("Valor em reais inválido");
  return arredondar(reais * 100);
};

export const centavosParaReais = (c: Centavos): number => {
  exigirCentavos(c);
  return c / 100;
};

/**
 * Lê valores no formato brasileiro: "R$ 1.234,56", "1234,5", "-R$ 10,00",
 * "R$ 1.000" (mil reais), "(R$ 50,00)" (negativo contábil). Retorna centavos.
 */
export function parseBRL(texto: string): Centavos {
  let s = texto.trim().replace(/\u00a0/g, " ");
  let negativo = false;
  if (/^\(.*\)$/.test(s)) {
    negativo = true;
    s = s.slice(1, -1).trim();
  }
  const tirarMenos = () => {
    if (s.startsWith("-")) {
      negativo = !negativo;
      s = s.slice(1).trim();
    }
  };
  tirarMenos();
  s = s.replace(/^R\$\s*/i, "");
  tirarMenos();
  s = s.replace(/\s/g, "");

  let inteiro: string;
  let decimal = "";
  if (/^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(s) || /^\d+(,\d{1,2})?$/.test(s)) {
    const [i, d = ""] = s.split(",");
    inteiro = i.replace(/\./g, "");
    decimal = d;
  } else if (/^\d+\.\d{1,2}$/.test(s)) {
    // "1234.56" (formato de máquina, sem separador de milhar)
    [inteiro, decimal] = s.split(".");
  } else {
    throw new Error(`Valor monetário inválido: "${texto}"`);
  }
  const centavos = Number(inteiro) * 100 + Number(decimal.padEnd(2, "0") || "0");
  if (!Number.isSafeInteger(centavos)) throw new Error("Valor monetário grande demais");
  return negativo && centavos !== 0 ? -centavos : centavos;
}

/** Formata centavos como "R$ 1.234,56" (ou "1.234,56" com simbolo: false). Sem depender de Intl. */
export function formatarBRL(c: Centavos, opcoes: { simbolo?: boolean } = {}): string {
  exigirCentavos(c);
  const abs = Math.abs(c);
  const inteiro = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const corpo = `${inteiro},${String(abs % 100).padStart(2, "0")}`;
  const comSimbolo = opcoes.simbolo === false ? corpo : `R$ ${corpo}`;
  return c < 0 ? `-${comSimbolo}` : comSimbolo;
}

/**
 * Divide um total por pesos sem perder nem criar centavo (método do maior resto).
 * Ex.: ratear(100, [1, 1, 1]) → [34, 33, 33]. A soma do resultado é sempre o total.
 */
export function ratear(total: Centavos, pesos: number[]): Centavos[] {
  exigirCentavos(total, "total");
  if (pesos.length === 0) throw new Error("Informe ao menos um peso");
  if (pesos.some((p) => !Number.isFinite(p) || p < 0)) throw new Error("Pesos precisam ser números não negativos");
  const somaPesos = pesos.reduce((a, b) => a + b, 0);
  if (somaPesos <= 0) throw new Error("A soma dos pesos precisa ser maior que zero");

  const sinal = total < 0 ? -1 : 1;
  const abs = Math.abs(total);
  const brutos = pesos.map((p) => (abs * p) / somaPesos);
  const partes = brutos.map((b) => Math.floor(Number(b.toPrecision(15))));
  let sobra = abs - partes.reduce((a, b) => a + b, 0);
  const ordem = brutos
    .map((b, i) => ({ i, resto: b - partes[i] }))
    .filter((x) => pesos[x.i] > 0)
    .sort((a, b) => b.resto - a.resto || a.i - b.i);
  for (let k = 0; sobra > 0; k = (k + 1) % ordem.length, sobra--) partes[ordem[k].i]++;
  return partes.map((p) => p * sinal);
}

/** Divide em n partes iguais; os centavos que sobram vão pras primeiras. */
export function dividirIgual(total: Centavos, n: number): Centavos[] {
  if (!Number.isInteger(n) || n < 1) throw new Error("Quantidade de partes precisa ser inteira e maior que zero");
  return ratear(total, new Array(n).fill(1));
}

/** Aplica percentual com arredondamento: percentual(10000, 12.5) → 1250. */
export function percentual(c: Centavos, pct: number): Centavos {
  exigirCentavos(c);
  if (!Number.isFinite(pct)) throw new Error("Percentual inválido");
  return arredondar((c * pct) / 100);
}

/** Montante com juros simples: P × (1 + i × n). Taxa em % por período. */
export function jurosSimples(principal: Centavos, taxaPct: number, periodos: number): Centavos {
  exigirCentavos(principal, "principal");
  if (periodos < 0) throw new Error("Períodos não pode ser negativo");
  return arredondar(principal * (1 + (taxaPct / 100) * periodos));
}

/** Montante com juros compostos: P × (1 + i)^n. Taxa em % por período. */
export function jurosCompostos(principal: Centavos, taxaPct: number, periodos: number): Centavos {
  exigirCentavos(principal, "principal");
  if (periodos < 0) throw new Error("Períodos não pode ser negativo");
  if (taxaPct <= -100) throw new Error("Taxa precisa ser maior que -100%");
  return arredondar(principal * Math.pow(1 + taxaPct / 100, periodos));
}

/** Converte taxa equivalente: ex. 1% a.m. → taxaEquivalente(1, 12) = 12,6825% a.a. */
export function taxaEquivalente(taxaPct: number, periodos: number): number {
  return (Math.pow(1 + taxaPct / 100, periodos) - 1) * 100;
}

export type ParcelaPrice = {
  numero: number;
  parcela: Centavos;
  juros: Centavos;
  amortizacao: Centavos;
  saldo: Centavos;
};

export type TabelaPrice = {
  /** Valor da parcela fixa (a última pode variar alguns centavos pra zerar o saldo). */
  parcela: Centavos;
  parcelas: ParcelaPrice[];
  totalPago: Centavos;
  totalJuros: Centavos;
};

/**
 * Tabela Price (parcelas fixas). Juros de cada mês são arredondados ao centavo
 * e a última parcela absorve a diferença, então o saldo final é exatamente 0.
 */
export function tabelaPrice(principal: Centavos, taxaMensalPct: number, nParcelas: number): TabelaPrice {
  exigirCentavos(principal, "principal");
  if (principal <= 0) throw new Error("Principal precisa ser maior que zero");
  if (!Number.isInteger(nParcelas) || nParcelas < 1) throw new Error("Número de parcelas precisa ser inteiro e maior que zero");
  if (!Number.isFinite(taxaMensalPct) || taxaMensalPct < 0) throw new Error("Taxa precisa ser zero ou positiva");

  const i = taxaMensalPct / 100;
  if (i === 0) {
    const partes = dividirIgual(principal, nParcelas);
    let saldo = principal;
    const parcelas = partes.map((p, k) => ({ numero: k + 1, parcela: p, juros: 0, amortizacao: p, saldo: (saldo -= p) }));
    return { parcela: partes[0], parcelas, totalPago: principal, totalJuros: 0 };
  }

  const pmt = arredondar((principal * i) / (1 - Math.pow(1 + i, -nParcelas)));
  const parcelas: ParcelaPrice[] = [];
  let saldo = principal;
  for (let k = 1; k <= nParcelas; k++) {
    const juros = arredondar(saldo * i);
    const ultima = k === nParcelas;
    const amortizacao = ultima ? saldo : pmt - juros;
    saldo -= amortizacao;
    parcelas.push({ numero: k, parcela: juros + amortizacao, juros, amortizacao, saldo });
  }
  const totalPago = parcelas.reduce((a, p) => a + p.parcela, 0);
  return { parcela: pmt, parcelas, totalPago, totalJuros: totalPago - principal };
}
