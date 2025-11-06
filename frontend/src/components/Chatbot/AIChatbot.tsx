import React, { useState } from 'react';
import './AIChatbot.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const examplePrompts = [
  "Criar uma história para um guerreiro nível 3",
  "Gerar um NPC misterioso para minha campanha",
  "Sugerir um encontro épico para aventureiros nível 5"
];

export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simular resposta da IA (você conectará sua IA aqui no futuro)
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Kaelen nasceu em Pedravale, uma pequena vila mineradora nas encostas das Montanhas Cinzentas. Filho de um ferreiro veterano de guerra e uma curandeira local, cresceu ouvindo histórias sobre honra, dever e proteção aos indefesos. Seu pai, Aldric, havia perdido a perna esquerda defendendo a vila de uma invasão goblin anos antes, e passou a forjar ferramentas e armas para os moradores. Desde jovem, Kaelen demonstrou um forte senso de justiça e uma habilidade natural com a espada. Treinado por seu pai nas artes da forja e do combate, ele rapidamente se destacou entre os jovens da vila. Aos 16 anos, quando uma horda de orcs atacou Pedravale, Kaelen liderou a defesa ao lado de seu pai, mostrando coragem e liderança além de sua idade. Após a batalha, decidido a proteger não apenas sua vila, mas também outras comunidades ameaçadas, Kaelen partiu em uma jornada para se tornar um cavaleiro errante. Ao longo de seus anos de aventura, ele enfrentou inúmeros desafios, desde bandidos e monstros até intrigas políticas em reinos distantes. Sua reputação como defensor dos fracos e oprimidos cresceu, assim como sua habilidade com a espada e seu conhecimento sobre táticas de combate. Apesar das dificuldades, Kaelen manteve-se fiel aos seus princípios, sempre buscando justiça e honra em cada ação. Agora, aos 25 anos, ele continua sua jornada, determinado a fazer do mundo um lugar mais seguro para todos.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleExampleClick = (example: string) => {
    handleSendMessage(example);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  return (
    <>
      {/* Botão flutuante */}
      <div
        className={`chatbot-bubble ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          width="28"
          height="28"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.67-.31-3.83-.86l-.27-.14-2.85.48.48-2.85-.14-.27C4.31 14.67 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
          <circle cx="8" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="16" cy="12" r="1.5" />
        </svg>
      </div>

      {/* Janela do chat */}
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-content">
            <h3>Gale o mago</h3>
            <p>Seu ajudante de RPG</p>
          </div>
          <button
            className="chatbot-close"
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </div>

        {/* Mensagens */}
        <div className="chatbot-messages">
          {messages.length === 0 ? (
            <div className="chatbot-welcome">
              <h4>Bem-vindo!</h4>
              <p>Como posso ajudar com sua campanha de RPG hoje?</p>

              <div className="chatbot-examples">
                <p className="examples-title">Exemplos de perguntas:</p>
                {examplePrompts.map((example, index) => (
                  <button
                    key={index}
                    className="example-button"
                    onClick={() => handleExampleClick(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`message ${message.sender}`}
                >
                  <div className="message-content">
                    {message.text}
                  </div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="message bot">
                  <div className="message-content typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <form className="chatbot-input-area" onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="chatbot-input"
          />
          <button
            type="submit"
            className="chatbot-send"
            disabled={!inputText.trim()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="24"
              height="24"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
};
