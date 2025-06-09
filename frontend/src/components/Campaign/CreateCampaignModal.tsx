import React, { useState } from 'react';
import { Modal, ModalConfirmFooter, Alert } from '../../ui';
import { campaignService, CreateCampaignData } from '../../services/campaignService';

interface CreateCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [formData, setFormData] = useState<CreateCampaignData>({
        name: '',
        description: '',
        max_players: 4
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError('Nome da campanha é obrigatório');
            return;
        }

        if (formData.max_players < 1 || formData.max_players > 10) {
            setError('Número de jogadores deve ser entre 1 e 10');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            console.log('Submitting campaign data:', formData);

            await campaignService.createCampaign(formData);

            // Reset form
            setFormData({
                name: '',
                description: '',
                max_players: 4
            });

            onSuccess();
        } catch (err) {
            setError('Erro ao criar campanha. Tente novamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({
                name: '',
                description: '',
                max_players: 4
            });
            setError(null);
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Criar Nova Campanha"
            size="md"
            footer={
                <ModalConfirmFooter
                    onConfirm={handleSubmit}
                    onCancel={handleClose}
                    confirmLabel={loading ? "Criando..." : "Criar Campanha"}
                    cancelLabel="Cancelar"
                    confirmVariant="bg-purple-600 hover:bg-purple-700"
                />
            }
        >
            <div className="space-y-4">
                {error && (
                    <Alert
                        message={error}
                        variant="error"
                        onClose={() => setError(null)}
                    />
                )}

                <div>
                    <label className="block text-indigo-200 mb-2 font-medium">
                        Nome da Campanha *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                     focus:outline-none focus:ring-2 focus:ring-purple-500 
                     bg-indigo-900/50 text-white"
                        placeholder="Ex: A Maldição de Strahd"
                        maxLength={100}
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-indigo-200 mb-2 font-medium">
                        Descrição
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                     focus:outline-none focus:ring-2 focus:ring-purple-500 
                     bg-indigo-900/50 text-white resize-none"
                        placeholder="Descreva sua campanha..."
                        rows={4}
                        maxLength={500}
                        disabled={loading}
                    />
                    <div className="text-xs text-indigo-400 mt-1">
                        {formData.description.length}/500 caracteres
                    </div>
                </div>

                <div>
                    <label className="block text-indigo-200 mb-2 font-medium">
                        Número Máximo de Jogadores
                    </label>
                    <input
                        type="number"
                        value={formData.max_players}
                        onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                     focus:outline-none focus:ring-2 focus:ring-purple-500 
                     bg-indigo-900/50 text-white"
                        min={1}
                        max={10}
                        disabled={loading}
                    />
                    <div className="text-xs text-indigo-400 mt-1">
                        Recomendado: 3-6 jogadores para melhor experiência
                    </div>
                </div>

                <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-800">
                    <h4 className="font-medium text-indigo-200 mb-2">ℹ️ Como funciona:</h4>
                    <ul className="text-sm text-indigo-300 space-y-1">
                        <li>• Você será o Mestre (DM) desta campanha</li>
                        <li>• Um código de convite será gerado automaticamente</li>
                        <li>• Compartilhe o código com seus jogadores para eles entrarem</li>
                        <li>• Você pode gerenciar personagens e sessões</li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
};

export default CreateCampaignModal;