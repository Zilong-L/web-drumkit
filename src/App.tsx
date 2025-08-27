import MidiSampler from './components/MidiSampler';
import Metronome from './components/Metronome';

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-3xl space-y-8">
        <Metronome />
        <MidiSampler />
      </div>
    </div>
  );
}

export default App;
