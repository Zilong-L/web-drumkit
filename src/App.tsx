import { useState } from 'react';
import MidiSampler from './components/MidiSampler';

function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-4xl font-bold tracking-tight">Web Drumkit</h1>
      <p className="text-gray-400">Starter with Vite + React + TypeScript + TailwindCSS</p>
      <button
        onClick={() => setCount(c => c + 1)}
        className="px-6 py-3 rounded bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition font-medium"
      >
        Count: {count}
      </button>
      <div className="w-full mt-8">
        <MidiSampler />
      </div>
    </div>
  );
}

export default App;
