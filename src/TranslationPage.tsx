import React, { useState } from "react";

interface TranslationResult {
  original: string;
  parsed: boolean;
  structure: string;
  translation: string;
  untranslatedWords: string[];
}

interface TranslationPageProps {
  translationResult: TranslationResult | null;
  onBack: () => void;
}

const TranslationPage: React.FC<TranslationPageProps> = ({
  translationResult,
  onBack,
}) => {
  const [showUntranslatedDialog, setShowUntranslatedDialog] = useState(false);

  return (
    <div
      className="translation-page"
      style={{
        backgroundImage: 'url("/bg2.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <h1 className="text-4xl font-bold ">Traducción</h1>

      <div className="space-y-3">
        <p className="tengwar-text">{translationResult?.translation}</p>
        {/* Default project font underneath */}
        <p className="text-white text-xl font-['VT323']">
          {translationResult?.translation}
        </p>
      </div>

      <button onClick={onBack} className="other">
        Volver
      </button>
      {translationResult?.untranslatedWords &&
        translationResult.untranslatedWords.length > 0 && (
          <button
            onClick={() => setShowUntranslatedDialog(true)}
            className="other"
          >
            Ver palabras no traducidas
          </button>
        )}

      {showUntranslatedDialog && (
        <div className="dialog">
          <h2 className="text-xl font-bold mb-4 text-white">
            Palabras no traducidas
          </h2>
          <p className="text-white mb-4">
            Las siguientes palabras no pudieron ser traducidas:
          </p>
          <ul className="text-white mb-4 max-h-60 overflow-y-auto">
            {translationResult?.untranslatedWords?.map((word, index) => (
              <li key={index} className="py-1 border-b border-gray-600">
                {word}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setShowUntranslatedDialog(false)}
            className="other"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};

export default TranslationPage;
