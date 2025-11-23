import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { TranslatorService, type TranslationResult } from "./translator";
import TranslationPage from "./TranslationPage";

function InputPage() {
  const [inputText, setInputText] = useState("");
  const navigate = useNavigate();
  const translator = new TranslatorService();

  const handleTranslate = () => {
    if (inputText.trim()) {
      const result = translator.translate(inputText.trim());
      // Store the full translation result in sessionStorage to access it on the next page
      sessionStorage.setItem("translationResult", JSON.stringify(result));
      navigate("/translation");
    }
  };

  return (
    <div className="app-container">
      <img
        src="/gandalf.gif"
        className=" absolute z-20"
        height={"300px"}
        style={{ left: "6.5em", bottom: "4em" }}
      />
      <h1>Traductor de Español a Sindarin</h1>
      <div className=" flex flex-col justify-center">
        <div className="lvl2">
          <textarea
            className="no-style"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe una frase en español para traducir a Sindarin..."
            rows={4}
          />
        </div>

        <button className="other" onClick={handleTranslate}>
          Traducir
        </button>
      </div>
    </div>
  );
}

function TranslationPageWrapper() {
  const navigate = useNavigate();

  // Retrieve the translation from sessionStorage
  const storedTranslation = sessionStorage.getItem("translationResult");
  // Parse the stored JSON string back to an object
  let translation: TranslationResult | null = null;
  if (storedTranslation) {
    try {
      translation = JSON.parse(storedTranslation);
    } catch (error) {
      console.error("Error parsing translation result:", error);
      translation = null;
    }
  }

  const handleBackToInput = () => {
    // Clear the stored translation when going back
    sessionStorage.removeItem("translationResult");
    navigate("/");
  };

  return (
    <TranslationPage
      translationResult={translation}
      onBack={handleBackToInput}
    />
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InputPage />} />
        <Route path="/translation" element={<TranslationPageWrapper />} />
      </Routes>
    </Router>
  );
}

export default App;
