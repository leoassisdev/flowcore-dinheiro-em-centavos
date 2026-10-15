// dinheiro.test.ts · Criado por FlowCore Soluções LTDA · flowcoresolucoes.com.br/codigos · licença MIT
import { describe, expect, it } from "vitest";
import {
  dividirIgual,
  formatarBRL,
  jurosCompostos,
  jurosSimples,
  parseBRL,
  percentual,
  ratear,
  reaisParaCentavos,
  tabelaPrice,
  taxaEquivalente,
} from "./dinheiro";

describe("dinheiro", () => {
  it("lê valores no formato brasileiro", () => {
    expect(parseBRL("R$ 1.234,56")).toBe(123456);
    expect(parseBRL("R$\u00a01.234,5")).toBe(123450);
    expect(parseBRL("1234,56")).toBe(123456);
    expect(parseBRL("R$ 1.000")).toBe(100000);
    expect(parseBRL("1234.56")).toBe(123456);
    expect(parseBRL("0,01")).toBe(1);
  });

  it("lê negativos em todos os formatos comuns", () => {
    expect(parseBRL("-R$ 10,00")).toBe(-1000);
    expect(parseBRL("R$ -10,00")).toBe(-1000);
    expect(parseBRL("(R$ 50,00)")).toBe(-5000);
    expect(parseBRL("-0,00")).toBe(0);
  });

  it("rejeita entradas ambíguas ou inválidas", () => {
    expect(() => parseBRL("12.345.67")).toThrow("Valor monetário inválido");
    expect(() => parseBRL("abc")).toThrow();
    expect(() => parseBRL("1,234")).toThrow();
    expect(() => parseBRL("")).toThrow();
  });

  it("formata BRL sem depender de Intl", () => {
    expect(formatarBRL(123456)).toBe("R$ 1.234,56");
    expect(formatarBRL(5)).toBe("R$ 0,05");
    expect(formatarBRL(-100000000)).toBe("-R$ 1.000.000,00");
    expect(formatarBRL(99, { simbolo: false })).toBe("0,99");
    expect(() => formatarBRL(1.5)).toThrow("inteiro");
  });

  it("converte reais em centavos sem erro de float", () => {
    expect(reaisParaCentavos(0.1 + 0.2)).toBe(30);
    expect(reaisParaCentavos(1.005)).toBe(101);
    expect(reaisParaCentavos(19.99)).toBe(1999);
  });

  it("rateia sem perder centavo", () => {
    expect(ratear(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(dividirIgual(1000, 3)).toEqual([334, 333, 333]);
    expect(ratear(10000, [70, 20, 10])).toEqual([7000, 2000, 1000]);
    expect(ratear(-100, [1, 1, 1])).toEqual([-34, -33, -33]);
    expect(ratear(5, [0, 1, 1])).toEqual([0, 3, 2]);
    for (const total of [1, 7, 99, 12345, 1000001]) {
      const partes = ratear(total, [3.3, 1.7, 5, 0.01]);
      expect(partes.reduce((a, b) => a + b, 0)).toBe(total);
    }
    expect(() => ratear(100, [0, 0])).toThrow();
    expect(() => ratear(100, [-1, 2])).toThrow();
  });

  it("aplica percentual com arredondamento correto", () => {
    expect(percentual(10000, 12.5)).toBe(1250);
    expect(percentual(999, 10)).toBe(100);
    expect(percentual(1005, 50)).toBe(503);
    expect(percentual(-1005, 50)).toBe(-503);
  });

  it("calcula juros simples, compostos e taxa equivalente", () => {
    expect(jurosSimples(100000, 2, 6)).toBe(112000);
    expect(jurosCompostos(100000, 1, 12)).toBe(112683);
    expect(taxaEquivalente(1, 12)).toBeCloseTo(12.6825, 4);
    expect(() => jurosCompostos(100, -100, 1)).toThrow();
  });

  it("monta Tabela Price com saldo final zerado", () => {
    const t = tabelaPrice(1_000_000, 1, 12);
    expect(t.parcela).toBe(88849);
    expect(t.parcelas).toHaveLength(12);
    expect(t.parcelas[0]).toEqual({ numero: 1, parcela: 88849, juros: 10000, amortizacao: 78849, saldo: 921151 });
    expect(t.parcelas[11].saldo).toBe(0);
    expect(Math.abs(t.parcelas[11].parcela - 88849)).toBeLessThanOrEqual(5);
    expect(t.parcelas.reduce((a, p) => a + p.amortizacao, 0)).toBe(1_000_000);
    expect(t.totalJuros).toBe(t.totalPago - 1_000_000);
  });

  it("parcela sem juros divide igual e valida entradas", () => {
    const t = tabelaPrice(10000, 0, 3);
    expect(t.parcelas.map((p) => p.parcela)).toEqual([3334, 3333, 3333]);
    expect(t.totalJuros).toBe(0);
    expect(t.parcelas[2].saldo).toBe(0);
    expect(() => tabelaPrice(0, 1, 3)).toThrow();
    expect(() => tabelaPrice(100, 1, 0)).toThrow();
  });
});
