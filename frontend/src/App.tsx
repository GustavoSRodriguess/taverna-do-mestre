import React from 'react';

const App: React.FC = () => {
  return (
    <div className="font-sans bg-gradient-to-b from-blue-900 to-black text-white">
      {/* Header */}
      <header className="p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold font-cinzel">RPG Creator</div>
          <nav>
            <ul className="flex space-x-4">
              <li><a href="#" className="hover:text-purple-500">Início</a></li>
              <li><a href="#" className="hover:text-purple-500">Recursos</a></li>
              <li><a href="#" className="hover:text-purple-500">Preços</a></li>
              <li><a href="#" className="hover:text-purple-500">Contato</a></li>
            </ul>
          </nav>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Login/Registro
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold font-cinzel mb-4">
            Crie Campanhas de RPG Incríveis com IA e Geração Procedural
          </h1>
          <p className="text-xl mb-8">
            Simplifique a criação de mapas, NPCs e narrativas para suas sessões de RPG.
          </p>
          <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700">
            Comece Agora
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-900 py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold font-cinzel mb-8">O Que Você Pode Fazer?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-purple-600 rounded-lg">
              <div className="text-purple-500 text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold font-cinzel mb-2">Geração de Mapas</h3>
              <p className="text-gray-400">Crie mapas personalizados com algoritmos de geração procedural.</p>
            </div>
            <div className="p-6 border border-purple-600 rounded-lg">
              <div className="text-purple-500 text-4xl mb-4">🧙</div>
              <h3 className="text-xl font-bold font-cinzel mb-2">Criação de NPCs</h3>
              <p className="text-gray-400">Gere NPCs únicos com atributos e histórias detalhadas.</p>
            </div>
            <div className="p-6 border border-purple-600 rounded-lg">
              <div className="text-purple-500 text-4xl mb-4">📖</div>
              <h3 className="text-xl font-bold font-cinzel mb-2">Narrativas Dinâmicas</h3>
              <p className="text-gray-400">Crie narrativas adaptáveis com base nas escolhas dos jogadores.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="bg-gray-800 py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold font-cinzel mb-8">Veja Como Funciona</h2>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
            <p className="text-gray-400 mb-4">Aqui vai um vídeo ou GIF demonstrando a plataforma.</p>
            <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700">
              Experimente Grátis
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-900 py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold font-cinzel mb-8">O Que Nossos Usuários Dizem</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 border border-purple-600 rounded-lg">
              <p className="text-gray-400 mb-4">
                "Essa plataforma mudou completamente minhas sessões de RPG. Recomendo!"
              </p>
              <p className="text-purple-500 font-bold">João, Mestre de RPG</p>
            </div>
            <div className="p-6 border border-purple-600 rounded-lg">
              <p className="text-gray-400 mb-4">
                "A geração de mapas é incrível. Economiza horas de trabalho!"
              </p>
              <p className="text-purple-500 font-bold">Maria, Jogadora</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-800 py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold font-cinzel mb-8">Planos Acessíveis para Todos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-purple-600 rounded-lg">
              <h3 className="text-xl font-bold font-cinzel mb-4">Básico</h3>
              <p className="text-gray-400 mb-4">Grátis</p>
              <ul className="text-gray-400 mb-6">
                <li>Mapas básicos</li>
                <li>NPCs limitados</li>
              </ul>
              <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700">
                Assinar
              </button>
            </div>
            <div className="p-6 border border-purple-600 rounded-lg bg-gray-900">
              <h3 className="text-xl font-bold font-cinzel mb-4">Premium</h3>
              <p className="text-gray-400 mb-4">$10/mês</p>
              <ul className="text-gray-400 mb-6">
                <li>Mapas avançados</li>
                <li>NPCs ilimitados</li>
                <li>Narrativas dinâmicas</li>
              </ul>
              <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700">
                Assinar
              </button>
            </div>
            <div className="p-6 border border-purple-600 rounded-lg">
              <h3 className="text-xl font-bold font-cinzel mb-4">Empresarial</h3>
              <p className="text-gray-400 mb-4">$25/mês</p>
              <ul className="text-gray-400 mb-6">
                <li>Tudo do Premium</li>
                <li>Suporte prioritário</li>
              </ul>
              <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700">
                Assinar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="container mx-auto text-center">
          <div className="mb-6">
            <ul className="flex justify-center space-x-6">
              <li><a href="#" className="hover:text-purple-500">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-purple-500">Suporte</a></li>
              <li><a href="#" className="hover:text-purple-500">Termos de Uso</a></li>
            </ul>
          </div>
          <div className="mb-6">
            <p className="text-gray-400">Siga-nos:</p>
            <div className="flex justify-center space-x-4">
              <a href="#" className="text-gray-400 hover:text-purple-500">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-purple-500">Instagram</a>
              <a href="#" className="text-gray-400 hover:text-purple-500">Discord</a>
            </div>
          </div>
          <div>
            <p className="text-gray-400">Assine nossa newsletter:</p>
            <div className="flex justify-center mt-2">
              <input
                type="email"
                placeholder="Seu e-mail"
                className="px-4 py-2 rounded-l-lg bg-gray-800 text-white focus:outline-none"
              />
              <button className="bg-purple-600 text-white px-4 py-2 rounded-r-lg hover:bg-purple-700">
                Assinar
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;