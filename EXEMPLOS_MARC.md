# 📚 Fontes de Arquivos MARC para Teste

## 🔗 Links Diretos para Download

### 1. **Library of Congress (LOC) - Exemplos MARC21**
- **URL:** https://www.loc.gov/marc/bibliographic/
- **Descrição:** A Biblioteca do Congresso dos EUA fornece exemplos oficiais de registros MARC21
- **Formato:** Texto legível e XML
- **Recomendado:** ✅ Melhor fonte oficial

### 2. **OCLC - WorldCat MARC Records**
- **URL:** https://www.oclc.org/en/worldcat.html
- **Descrição:** Maior catálogo bibliográfico do mundo, permite exportar registros MARC
- **Acesso:** Requer conta (gratuita para bibliotecas)
- **Formato:** MARC21 completo

### 3. **Biblioteca Nacional do Brasil**
- **URL:** https://www.bn.gov.br/
- **Descrição:** Catálogo da BNDigital com exportação MARC
- **Formato:** MARC21 em português

### 4. **Repositórios GitHub**
- Busque por: "MARC21 sample files" ou "bibliographic records MARC"
- Exemplos comuns em repositórios de bibliotecas digitais

### 5. **MarcEdit - Ferramenta de Teste**
- **URL:** https://marcedit.reeset.net/
- **Descrição:** Ferramenta gratuita que inclui exemplos de registros MARC
- **Formato:** Vários formatos suportados

## 📝 Criar Arquivo MARC de Teste Manualmente

Você pode criar um arquivo de teste simples com este conteúdo:

```
00000nam a2200000 a 4500
001     test-001
003     SGBC
005     20240101120000.0
008     240101s2024    br |||| ||| ||| ||| ||| ||| por d
020  \\$a9788535914061
040  \\$aSGBC$cSGBC
100 1\\$aMachado de Assis
245 10\\$aDom Casmurro$bRomance
260  \\$aSão Paulo :$bCompanhia das Letras,$c2020
300  \\$a256 p.
500  \\$aRomance clássico da literatura brasileira
650  \\$aLiteratura Brasileira
041  \\$apor
044  \\$aBRA
090  \\$aM123
```

Salve como `teste_marc.mrc` e teste a importação.

## 🧪 Como Testar

1. **Baixe um arquivo MARC de exemplo**
2. **Acesse o Catálogo da Rede**
3. **Clique em "Importar MARC"**
4. **Selecione o arquivo**
5. **Verifique os registros importados**

## ⚠️ Observações

- Arquivos MARC podem ter diferentes codificações (UTF-8, ISO-8859-1)
- O importador suporta formato texto legível (não binário)
- Registros com ISBN serão atualizados se já existirem

