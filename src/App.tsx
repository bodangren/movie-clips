import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface AppInfo {
  name: string;
  version: string;
  platform: string;
  arch: string;
}

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [directoryPath, setDirectoryPath] = useState("");
  const [directoryContents, setDirectoryContents] = useState<string[]>([]);

  useEffect(() => {
    invoke<AppInfo>("get_app_info")
      .then(setAppInfo)
      .catch((e) => setError(`Failed to load app info: ${e}`));
  }, []);

  async function greet() {
    try {
      setError(null);
      setGreetMsg(await invoke("greet", { name }));
    } catch (e) {
      setError(`Greet failed: ${e}`);
    }
  }

  async function scanDir() {
    try {
      setError(null);
      const contents = await invoke<string[]>("scan_directory", { path: directoryPath });
      setDirectoryContents(contents);
    } catch (e) {
      setError(`Scan failed: ${e}`);
      setDirectoryContents([]);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    greet();
  }

  function handleNameChange(e: ChangeEvent<HTMLInputElement>) {
    setName(e.currentTarget.value);
  }

  function handlePathChange(e: ChangeEvent<HTMLInputElement>) {
    setDirectoryPath(e.currentTarget.value);
  }

  return (
    <main className="container">
      <h1>Welcome to movie-clips</h1>

      {appInfo && (
        <div className="app-info">
          <p>
            {appInfo.name} v{appInfo.version} on {appInfo.platform}/{appInfo.arch}
          </p>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <div className="row">
        <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank" rel="noopener noreferrer">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <section className="section">
        <h2>Greet Command</h2>
        <form className="row" onSubmit={handleSubmit}>
          <input
            id="greet-input"
            onChange={handleNameChange}
            placeholder="Enter a name..."
          />
          <button type="submit">Greet</button>
        </form>
        {greetMsg && <p className="result">{greetMsg}</p>}
      </section>

      <section className="section">
        <h2>Directory Scanner</h2>
        <div className="row">
          <input
            id="dir-input"
            onChange={handlePathChange}
            placeholder="/path/to/directory"
          />
          <button type="button" onClick={scanDir}>Scan</button>
        </div>
        {directoryContents.length > 0 && (
          <ul className="file-list">
            {directoryContents.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
