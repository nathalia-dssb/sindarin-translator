import { CFGrammar, type Dictionary, type Token } from "./grammar";
import { ES_GA } from "./dictionaries/es_ga";
import { ES_SIN } from "./dictionaries/es_sin";

export interface TranslationResult {
  original: string;
  parsed: boolean;
  structure: string;
  translation: string;
  untranslatedWords: string[];
}

export class TranslatorService {
  private grammar: CFGrammar;
  private dictionaries: { es_ga: Dictionary; es_sin: Dictionary } = {
    es_ga: ES_GA,
    es_sin: ES_SIN,
  };

  constructor() {
    this.grammar = new CFGrammar();
  }

  translate(spanishText: string): TranslationResult {
    const tokens = this.grammar.tokenize(spanishText, this.dictionaries);
    const parsed = this.grammar.parse(tokens);
    const structure = this.analyzeStructure(tokens);
    const reorderedTokens = this.reorderToVSO(tokens);
    const { translatedText, untranslatedWords } = this.translateSentenceWithUntranslated(reorderedTokens);

    return {
      original: spanishText,
      parsed,
      structure,
      translation: translatedText,
      untranslatedWords,
    };
  }

  private analyzeStructure(tokens: Token[]): string {
    const tokenTypes = tokens.map((token) => token.type);

    if (tokenTypes.includes("SALUDO_TOKEN")) {
      return "Saludo";
    } else if (tokenTypes.includes("PREGUNTA_TOKEN")) {
      return "Pregunta";
    } else if (tokenTypes.includes("VERBO_TOKEN")) {
      const verbCount = tokenTypes.filter((t) => t === "VERBO_TOKEN").length;
      const sustantivoCount = tokenTypes.filter(
        (t) => t === "SUSTANTIVO"
      ).length;

      if (verbCount > 0 && sustantivoCount >= 2) {
        return "Oración SVO";
      } else if (verbCount > 0 && sustantivoCount === 1) {
        return "Sujeto + Verbo o Verbo + Objeto";
      } else if (verbCount > 0) {
        return "Verbo (intransitivo)";
      }
    }

    return "Otra estructura";
  }

  private reorderToVSO(tokens: Token[]): Token[] {
    const hasIdentityPhrase = tokens.some((token, index) => {
      if (index < tokens.length - 1) {
        const nextToken = tokens[index + 1];
        const isIdentityPhrase =
          token.value.toLowerCase() === "me llamo" ||
          token.value.toLowerCase() === "mi nombre es";
        const isCapitalizedName =
          nextToken.value.length > 0 &&
          nextToken.value[0] === nextToken.value[0].toUpperCase() &&
          nextToken.value.toLowerCase() !== nextToken.value;
        return isIdentityPhrase && isCapitalizedName;
      }
      return false;
    });

    if (hasIdentityPhrase) {
      return tokens;
    }

    const verbs = tokens.filter((token) => token.type === "VERBO_TOKEN");
    const sustantivos = tokens.filter((token) => token.type === "SUSTANTIVO");
    const adjetivos = tokens.filter((token) => token.type === "ADJETIVO");
    const otros = tokens.filter(
      (token) => !["VERBO_TOKEN", "SUSTANTIVO", "ADJETIVO"].includes(token.type)
    );

    const reordered: Token[] = [];

    reordered.push(...verbs);

    reordered.push(...sustantivos);

    reordered.push(...adjetivos);

    reordered.push(...otros);

    return reordered;
  }

  private translateSentenceWithUntranslated(tokens: Token[]): { translatedText: string; untranslatedWords: string[] } {
    const translatedWords: string[] = [];
    const untranslatedWords: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      const namePhrases = ["me llamo", "mi nombre es"];
      if (
        namePhrases.includes(token.value.toLowerCase()) &&
        i + 1 < tokens.length
      ) {
        const nextToken = tokens[i + 1];

        if (
          nextToken.value.length > 0 &&
          nextToken.value[0] === nextToken.value[0].toUpperCase() &&
          nextToken.value.toLowerCase() !== nextToken.value
        ) {
          const translatedPhrase = this.translateWord(token.value);
          if (translatedPhrase) {
            translatedWords.push(`${translatedPhrase} ${nextToken.value}`);

            // If the phrase wasn't translated, add it to untranslated words
            if (translatedPhrase === "") {
              untranslatedWords.push(token.value);
            }
          } else {
            // Add the phrase to untranslated words if it wasn't translated
            untranslatedWords.push(token.value);
          }

          i++;
          continue;
        }
      }

      const translatedWord = this.translateWord(token.value);
      if (translatedWord) {
        translatedWords.push(translatedWord);

        // If the translation is the same as the original (meaning it wasn't actually translated)
        if (translatedWord.toLowerCase() === token.value.toLowerCase()) {
          untranslatedWords.push(token.value);
        }
      } else {
        // Add to untranslated words if no translation was found
        untranslatedWords.push(token.value);
      }
    }

    return {
      translatedText: translatedWords.join(" "),
      untranslatedWords: Array.from(new Set(untranslatedWords)) // Remove duplicates
    };
  }

  private translateWord(spanishWord: string): string {
    if (
      spanishWord.length > 0 &&
      spanishWord[0] === spanishWord[0].toUpperCase() &&
      spanishWord.toLowerCase() !== spanishWord
    ) {
      return spanishWord;
    }

    for (const [category, data] of Object.entries(
      this.dictionaries.es_sin.categorias
    )) {
      if (data.subcategorias) {
        for (const entries of Object.values(data.subcategorias)) {
          for (const entry of entries) {
            if (entry.es.toLowerCase() === spanishWord.toLowerCase()) {
              return entry.si || "";
            }
          }
        }
      }
    }

    for (const [category, data] of Object.entries(
      this.dictionaries.es_ga.categorias
    )) {
      if (data.subcategorias) {
        for (const entries of Object.values(data.subcategorias)) {
          for (const entry of entries) {
            if (entry.es.toLowerCase() === spanishWord.toLowerCase()) {
              return entry.ga || "";
            }
          }
        }
      }
    }
    return "";
  }
}
