import { useState } from 'react'
import axios from 'axios';

interface NPC {
  attribute: {[key: string]: number};
  description: string;
}

function App() {
  const [npc, setNpc] = useState<NPC | null>(null);

  const genrateNpc = async () => {
    try {
      const response = await axios.post<NPC>('http://localhost:8080/generate-npc');
      setNpc(response.data);
    } catch (e) {
      console.log('erro na hora de criar npc: ', e);
    }
  };

  return (
    <div>
      <button onClick={genrateNpc}>Gerar NPC</button>
      {npc && (
        <div>
          <h2>NPC gerado</h2>
          <p>Atributos {JSON.stringify(npc.attribute)}</p>
          <p>Descrição {JSON.stringify(npc.description)}</p>
        </div>
      )}
    </div>
  )
}

export default App
