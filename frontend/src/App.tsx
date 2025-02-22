import { useState } from 'react'
import axios from 'axios';

interface NPC {
  attributes: {[key: string]: number};
  description: string;
}

function App() {
  const [npc, setNpc] = useState<NPC | null>(null);

  const generateNpc = async () => {
    try {
      const response = await axios.post<NPC>('http://localhost:8080/generate-npc');
      setNpc(response.data);
    } catch (e) {
      console.log('erro na hora de criar npc: ', e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <button
        onClick={generateNpc}
        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
      >
        Gerar NPC
      </button>

      {npc && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">NPC Gerado</h2>
          <p className="text-gray-700">
            <span className="font-semibold">Atributos:</span> {JSON.stringify(npc.attributes)}
          </p>
          <p className="text-gray-700 mt-2">
            <span className="font-semibold">Descrição:</span> {npc.description}
          </p>
        </div>
      )}
    </div>
  );
}

export default App
