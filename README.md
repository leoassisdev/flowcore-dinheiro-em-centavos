# Dinheiro em Centavos

> Lê e formata BRL, rateia sem perder centavo, calcula juros e monta a Tabela Price. Financeiro sem erro de arredondamento nem diferença na conciliação.

**Ver ao vivo, com preview e manual:** https://flowcoresolucoes.com.br/codigos/dinheiro-em-centavos

Criado por **FlowCore Soluções LTDA**.

## Arquivos

- [`src/dinheiro.ts`](src/dinheiro.ts)
- [`src/dinheiro.test.ts`](src/dinheiro.test.ts)

## Como instalar

1. **Funciona onde você já roda** Node 18+, Cloudflare Workers, Deno, Bun, Vercel e Netlify Functions. Zero dependência: só fetch e Web Crypto, que já vêm no runtime.
2. **Crie src/lib/dinheiro.ts** Copie o conteúdo de `src/dinheiro.ts` e `src/dinheiro.test.ts` deste repositório.
3. **Use**

   ```bash
   const total = parseBRL("R$ 1.000,00");          // 100000
   ratear(total, [1, 1, 1]);                        // [33334, 33333, 33333]
   formatarBRL(tabelaPrice(total, 1.99, 12).parcela); // "R$ 94,50"
   ```

4. **Rode o teste junto** O arquivo de teste (`src/dinheiro.test.ts`) cobre 10 cenários. Copie para src/lib/ ao lado e rode:

   ```bash
   npm install -D vitest
   npx vitest run src/lib
   ```


## Testes

`src/dinheiro.test.ts` cobre 10 cenários.

```bash
npm install
npm test
```

## Licença

MIT. Pode usar em projeto pessoal ou comercial, de graça. A única condição é manter a linha **“Criado por FlowCore Soluções LTDA”** (ou o crédito de adaptação) onde ela está.

---

Precisa disso integrado no seu sistema? A [FlowCore](https://flowcoresolucoes.com.br) desenvolve sob medida.
