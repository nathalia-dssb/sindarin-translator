export interface GrammarRule {
  left: string;
  right: string[];
}

export interface Token {
  type: string;
  value: string;
  pos: number;
}

export interface DictionaryEntry {
  es: string;
  ga?: string;
  si?: string;
}

export interface Subcategory {
  [subcategoryName: string]: DictionaryEntry[];
}

export interface Category {
  subcategorias: Subcategory;
}

export interface Dictionary {
  categorias: {
    [categoryName: string]: Category;
  };
}

export class CFGrammar {
  nonTerminals: Set<string> = new Set([
    "entrada",
    "saludo",
    "pregunta",
    "oracionSVO",
    "sujeto",
    "verbo",
    "objeto",
    "sintagmaNominal",
  ]);

  terminals: Set<string> = new Set([
    "SALUDO_TOKEN",
    "PREGUNTA_TOKEN",
    "VERBO_TOKEN",
    "ARTICULO",
    "SUSTANTIVO",
    "ADJETIVO",
    "UNKNOWN_TOKEN",
  ]);

  startSymbol: string = "entrada";

  productionRules: GrammarRule[] = [
    { left: "entrada", right: ["saludo"] },
    { left: "entrada", right: ["pregunta"] },
    { left: "entrada", right: ["oracionSVO"] },

    { left: "saludo", right: ["SALUDO_TOKEN"] },

    { left: "pregunta", right: ["PREGUNTA_TOKEN"] },

    { left: "oracionSVO", right: ["sujeto", "verbo", "objeto"] },
    { left: "oracionSVO", right: ["sujeto", "verbo"] },
    { left: "oracionSVO", right: ["verbo", "objeto"] },
    { left: "oracionSVO", right: ["verbo"] },

    { left: "sujeto", right: ["sintagmaNominal"] },

    { left: "objeto", right: ["sintagmaNominal"] },

    { left: "verbo", right: ["VERBO_TOKEN"] },

    { left: "sintagmaNominal", right: ["ARTICULO", "SUSTANTIVO"] },
    { left: "sintagmaNominal", right: ["SUSTANTIVO"] },
    { left: "sintagmaNominal", right: ["ARTICULO", "SUSTANTIVO", "ADJETIVO"] },
    { left: "sintagmaNominal", right: ["ADJETIVO", "SUSTANTIVO"] },
  ];

  tokenPatterns: { [key: string]: RegExp } = {
    UNKNOWN_TOKEN: /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+/i,
  };

  constructor() {}

  identifyTokenType(
    word: string,
    dictionaries: { es_ga: Dictionary; es_sin: Dictionary }
  ): string {
    for (const [categoryKey, categoryData] of Object.entries(
      dictionaries.es_sin.categorias
    )) {
      if (categoryData.subcategorias) {
        for (const entries of Object.values(categoryData.subcategorias)) {
          for (const entry of entries) {
            if (entry.es.toLowerCase() === word.toLowerCase()) {
              switch (categoryKey) {
                case "saludo":
                  return "SALUDO_TOKEN";
                case "preguntas":
                  return "PREGUNTA_TOKEN";
                case "verbo":
                  return "VERBO_TOKEN";
                case "adjetivo":
                  return "ADJETIVO";
                case "pronombre":
                case "sustantivo":
                  return "SUSTANTIVO";
                case "articulo":
                  return "ARTICULO";
                default:
                  return "SUSTANTIVO";
              }
            }
          }
        }
      }
    }

    for (const [categoryKey, categoryData] of Object.entries(
      dictionaries.es_ga.categorias
    )) {
      if (categoryData.subcategorias) {
        for (const entries of Object.values(categoryData.subcategorias)) {
          for (const entry of entries) {
            if (entry.es.toLowerCase() === word.toLowerCase()) {
              switch (categoryKey) {
                case "saludo":
                  return "SALUDO_TOKEN";
                case "preguntas":
                  return "PREGUNTA_TOKEN";
                case "verbo":
                  return "VERBO_TOKEN";
                case "adjetivo":
                  return "ADJETIVO";
                case "pronombre":
                case "sustantivo":
                  return "SUSTANTIVO";
                case "articulo":
                  return "ARTICULO";
                default:
                  return "SUSTANTIVO";
              }
            }
          }
        }
      }
    }

    return "UNKNOWN_TOKEN";
  }

  tokenize(
    sentence: string,
    dictionaries: { es_ga: Dictionary; es_sin: Dictionary }
  ): Token[] {
    const tokens: Token[] = [];

    let text = sentence.trim();

    const allDictionaries = [dictionaries.es_sin, dictionaries.es_ga];

    const allEntries = [];
    for (const dict of allDictionaries) {
      for (const [category, data] of Object.entries(dict.categorias)) {
        if (data.subcategorias) {
          for (const entries of Object.values(data.subcategorias)) {
            for (const entry of entries) {
              allEntries.push(entry);
            }
          }
        }
      }
    }

    allEntries.sort((a, b) => b.es.length - a.es.length);

    while (text.length > 0) {
      let foundMatch = false;

      for (const entry of allEntries) {
        if (text.toLowerCase().startsWith(entry.es.toLowerCase())) {
          const nextCharIndex = entry.es.length;
          if (
            nextCharIndex >= text.length ||
            /\s|[,.;:!?¿¡'"()[\]{}]/.test(text[nextCharIndex])
          ) {
            tokens.push({
              type: this.identifyTokenType(entry.es, dictionaries),
              value: entry.es,
              pos: tokens.length,
            });

            text = text.substring(entry.es.length).trim();
            foundMatch = true;
            break;
          }
        }
      }

      if (!foundMatch) {
        const wordEnd = text.search(/\s|$/);
        const word = wordEnd === -1 ? text : text.substring(0, wordEnd);

        const punctuationRegex =
          /^[^\wáéíóúÁÉÍÓÚñÑüÜ¡¿]+|[^\wáéíóúÁÉÍÓÚñÑüÜ¡¿]+$/g;
        const cleanWord = word.replace(punctuationRegex, "");

        if (cleanWord.length > 0) {
          const tokenType = this.identifyTokenType(cleanWord, dictionaries);
          tokens.push({
            type: tokenType,
            value: cleanWord,
            pos: tokens.length,
          });
        }

        text = text.substring(word.length).trim();
      }
    }

    return tokens;
  }

  parse(tokens: Token[]): boolean {
    const tokenTypes = tokens.map((token) => token.type);

    return this.checkMatch(tokenTypes, this.startSymbol);
  }

  private checkMatch(tokens: string[], rule: string): boolean {
    if (tokens.length === 0) return rule === "epsilon";

    if (rule === "entrada") {
      return (
        this.checkMatch(tokens, "saludo") ||
        this.checkMatch(tokens, "pregunta") ||
        this.checkMatch(tokens, "oracionSVO")
      );
    } else if (rule === "saludo") {
      return tokens.length === 1 && tokens[0] === "SALUDO_TOKEN";
    } else if (rule === "pregunta") {
      return tokens.length === 1 && tokens[0] === "PREGUNTA_TOKEN";
    } else if (rule === "oracionSVO") {
      if (tokens.length === 3) {
        for (let i = 0; i < tokens.length; i++) {
          if (tokens[i] === "VERBO_TOKEN") {
            const beforeVerb = tokens.slice(0, i);
            const afterVerb = tokens.slice(i + 1);

            if (beforeVerb.length > 0 && afterVerb.length > 0) {
              if (
                this.checkMatch(beforeVerb, "sujeto") &&
                this.checkMatch(afterVerb, "objeto")
              ) {
                return true;
              }
            }
          }
        }
      } else if (tokens.length === 2) {
        if (tokens[0] === "VERBO_TOKEN") {
          return this.checkMatch([tokens[1]], "objeto");
        } else if (tokens[1] === "VERBO_TOKEN") {
          return this.checkMatch([tokens[0]], "sujeto");
        } else {
          return (
            (this.checkMatch([tokens[0]], "sujeto") &&
              this.checkMatch([tokens[1]], "verbo")) ||
            (this.checkMatch([tokens[0]], "verbo") &&
              this.checkMatch([tokens[1]], "objeto"))
          );
        }
      } else if (tokens.length === 1) {
        return tokens[0] === "VERBO_TOKEN";
      } else if (tokens.length > 3) {
        const verbIndex = tokens.indexOf("VERBO_TOKEN");
        if (verbIndex !== -1) {
          const beforeVerb = tokens.slice(0, verbIndex);
          const afterVerb = tokens.slice(verbIndex + 1);

          if (beforeVerb.length > 0 && this.checkMatch(beforeVerb, "sujeto")) {
            if (
              afterVerb.length === 0 ||
              this.checkMatch(afterVerb, "objeto")
            ) {
              return true;
            }
          }

          if (afterVerb.length > 0 && this.checkMatch(afterVerb, "objeto")) {
            return true;
          }
        }

        const hasVerb = tokens.includes("VERBO_TOKEN");
        const hasSustantivo = tokens.includes("SUSTANTIVO");
        return hasVerb || hasSustantivo;
      }
    } else if (rule === "sujeto" || rule === "objeto") {
      return this.checkMatch(tokens, "sintagmaNominal");
    } else if (rule === "verbo") {
      return tokens.length === 1 && tokens[0] === "VERBO_TOKEN";
    } else if (rule === "sintagmaNominal") {
      if (tokens.length === 1) {
        return tokens[0] === "SUSTANTIVO" || tokens[0] === "ADJETIVO";
      } else if (tokens.length === 2) {
        if (tokens[0] === "ARTICULO" && tokens[1] === "SUSTANTIVO") return true;
        if (tokens[0] === "ADJETIVO" && tokens[1] === "SUSTANTIVO") return true;
        if (tokens[0] === "SUSTANTIVO" && tokens[1] === "ADJETIVO") return true;
      } else if (tokens.length === 3) {
        if (
          tokens[0] === "ARTICULO" &&
          tokens[1] === "SUSTANTIVO" &&
          tokens[2] === "ADJETIVO"
        )
          return true;
        if (
          tokens[0] === "ADJETIVO" &&
          tokens[1] === "ARTICULO" &&
          tokens[2] === "SUSTANTIVO"
        )
          return true;
      }
    }

    return false;
  }
}
