import React, { useState } from 'react';
import {
    Page, Section, Card, CardBorder, Button,
    Badge, Alert, Tabs, Modal, Loading, Tooltip,
    ModalConfirmFooter
} from '../ui';

const ComponentDoc: React.FC = () => {
    // Estados para os exemplos
    const [activeTab, setActiveTab] = useState('badges');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(true);

    // Simulação de loading
    const simulateLoading = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, 2000);
    };

    // Tabs de exemplo
    const tabs = [
        { id: 'badges', label: 'Badges', icon: '🏷️' },
        { id: 'alerts', label: 'Alerts', icon: '⚠️' },
        { id: 'tooltips', label: 'Tooltips', icon: '💬' },
        { id: 'modals', label: 'Modals', icon: '🔲' }
    ];

    return (
        <Page>
            <Section title="Exemplos de Componentes UI">
                <div className="max-w-4xl mx-auto">
                    <CardBorder className="mb-8">
                        <h2 className="text-xl font-bold mb-4">Componentes de UI Reutilizáveis</h2>
                        <p className="mb-4">
                            Estes componentes foram criados para serem facilmente reutilizados em todo o projeto.
                            Você pode importá-los diretamente do diretório UI e utilizá-los sem se preocupar com CSS.
                        </p>

                        <Tabs
                            tabs={tabs}
                            onChange={setActiveTab}
                            className="mt-6"
                        />

                        {/* Conteúdo com base na tab ativa */}
                        <div className="p-4 border border-indigo-700 rounded-lg bg-indigo-900/30">
                            {activeTab === 'badges' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Badges</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge text="Primary Badge" />
                                        <Badge text="Success Badge" variant="success" />
                                        <Badge text="Warning Badge" variant="warning" />
                                        <Badge text="Danger Badge" variant="danger" />
                                        <Badge text="Info Badge" variant="info" />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'alerts' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Alerts</h3>

                                    {showAlert && (
                                        <Alert
                                            title="Info Alert"
                                            message="Este é um alerta informativo que pode ser fechado."
                                            onClose={() => setShowAlert(false)}
                                        />
                                    )}

                                    <Alert
                                        title="Success Alert"
                                        message="Operação realizada com sucesso!"
                                        variant="success"
                                    />

                                    <Alert
                                        title="Warning Alert"
                                        message="Atenção! Esta ação pode ter consequências."
                                        variant="warning"
                                    />

                                    <Alert
                                        title="Error Alert"
                                        message="Erro ao processar sua solicitação."
                                        variant="error"
                                    />

                                    {!showAlert && (
                                        <Button
                                            buttonLabel="Mostrar Alerta"
                                            onClick={() => setShowAlert(true)}
                                        />
                                    )}
                                </div>
                            )}

                            {activeTab === 'tooltips' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Tooltips</h3>
                                    <div className="flex flex-wrap gap-6 p-8 justify-center">
                                        <Tooltip content="Tooltip no topo" position="top">
                                            <Button buttonLabel="Hover me (Top)" onClick={() => console.log('banana')}/>
                                        </Tooltip>

                                        <Tooltip content="Tooltip à direita" position="right">
                                            <Button buttonLabel="Hover me (Right)" onClick={() => console.log('banana')} />
                                        </Tooltip>

                                        <Tooltip content="Tooltip embaixo" position="bottom">
                                            <Button buttonLabel="Hover me (Bottom)" onClick={() => console.log('banana')} />
                                        </Tooltip>

                                        <Tooltip content="Tooltip à esquerda" position="left">
                                            <Button buttonLabel="Hover me (Left)" onClick={() => console.log('banana')} />
                                        </Tooltip>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'modals' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Modals</h3>
                                    <div className="flex flex-wrap gap-4">
                                        <Button
                                            buttonLabel="Abrir Modal"
                                            onClick={() => setIsModalOpen(true)}
                                        />

                                        <Button
                                            buttonLabel="Simular Loading"
                                            onClick={simulateLoading}
                                            classname="bg-indigo-600"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardBorder>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card
                            icon="🧙"
                            title="Card Component"
                            description="Este é um exemplo do componente Card que você já tinha anteriormente."
                            button={{
                                label: 'Ação do Card',
                                onClick: () => alert('Clicou no Card!'),
                                className: 'mt-4'
                            }}
                        />

                        <CardBorder>
                            <h3 className="text-lg font-bold mb-2">CardBorder Component</h3>
                            <p>Este é um exemplo do componente CardBorder que você já tinha anteriormente.</p>
                            <div className="mt-4">
                                <Button buttonLabel="Ação no CardBorder" onClick={() => alert('Clicou no CardBorder!')} />
                            </div>
                        </CardBorder>
                    </div>
                </div>
            </Section>

            {/* Modal de exemplo */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Exemplo de Modal"
                footer={
                    <ModalConfirmFooter
                        onConfirm={() => {
                            alert('Confirmou!');
                            setIsModalOpen(false);
                        }}
                        onCancel={() => setIsModalOpen(false)}
                        confirmLabel="Salvar"
                        confirmVariant="bg-purple-600 hover:bg-purple-700"
                    />
                }
            >
                <div className="py-4">
                    <p>Este é um exemplo de modal que você pode usar para confirmações, formulários ou exibir informações.</p>
                    <p className="mt-2">Você pode personalizar o tamanho, conteúdo e botões.</p>
                </div>
            </Modal>

            {/* Loading de exemplo */}
            {isLoading && <Loading fullScreen text="Carregando..." />}
        </Page>
    );
};

export default ComponentDoc;