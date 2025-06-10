import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, CardBorder, Alert, Modal, ModalConfirmFooter } from '../../ui';
import { campaignService, Campaign, UpdateCampaignData } from '../../services/campaignService';

interface CampaignSettingsProps {
    campaign: Campaign;
    onCampaignUpdate: () => void;
}

const CampaignSettings: React.FC<CampaignSettingsProps> = ({
    campaign,
    onCampaignUpdate
}) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [formData, setFormData] = useState<UpdateCampaignData>({
        name: campaign.name,
        description: campaign.description,
        max_players: campaign.max_players,
        current_session: campaign.current_session,
        status: campaign.status
    });

    const handleSave = async () => {
        if (!formData.name?.trim()) {
            setError('Nome da campanha é obrigatório');
            return;
        }

        if (formData.max_players && (formData.max_players < 1 || formData.max_players > 10)) {
            setError('Número de jogadores deve ser entre 1 e 10');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            await campaignService.updateCampaign(campaign.id, formData);
            setSuccess('Campanha atualizada com sucesso!');
            onCampaignUpdate();

        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar campanha');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setLoading(true);
            await campaignService.deleteCampaign(campaign.id);
            navigate('/campaigns');
        } catch (err: any) {
            setError(err.message || 'Erro ao deletar campanha');
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            name: campaign.name,
            description: campaign.description,
            max_players: campaign.max_players,
            current_session: campaign.current_session,
            status: campaign.status
        });
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="space-y-6">
            {error && (
                <Alert
                    message={error}
                    variant="error"
                    onClose={() => setError(null)}
                />
            )}

            {success && (
                <Alert
                    message={success}
                    variant="success"
                    onClose={() => setSuccess(null)}
                />
            )}

            {/* Informações básicas */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-4">Informações da Campanha</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-indigo-200 mb-2 font-medium">
                            Nome da Campanha *
                        </label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                       focus:outline-none focus:ring-2 focus:ring-purple-500 
                       bg-indigo-900/50 text-white"
                            placeholder="Nome da campanha"
                            maxLength={100}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-indigo-200 mb-2 font-medium">
                            Descrição
                        </label>
                        <textarea
                            value={formData.description || ''}
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
                            {formData.description?.length || 0}/500 caracteres
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-indigo-200 mb-2 font-medium">
                                Máximo de Jogadores
                            </label>
                            <input
                                type="number"
                                value={formData.max_players || ''}
                                onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-purple-500 
                         bg-indigo-900/50 text-white"
                                min={1}
                                max={10}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-indigo-200 mb-2 font-medium">
                                Sessão Atual
                            </label>
                            <input
                                type="number"
                                value={formData.current_session || ''}
                                onChange={(e) => setFormData({ ...formData, current_session: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-purple-500 
                         bg-indigo-900/50 text-white"
                                min={1}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-indigo-200 mb-2 font-medium">
                                Status
                            </label>
                            <select
                                value={formData.status || 'planning'}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-purple-500 
                         bg-indigo-900/50 text-white"
                                disabled={loading}
                            >
                                <option value="planning">Planejando</option>
                                <option value="active">Ativa</option>
                                <option value="paused">Pausada</option>
                                <option value="completed">Concluída</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <Button
                        buttonLabel={loading ? "Salvando..." : "Salvar Alterações"}
                        onClick={handleSave}
                        disabled={loading}
                    />

                    <Button
                        buttonLabel="Cancelar"
                        onClick={handleReset}
                        classname="bg-gray-600 hover:bg-gray-700"
                        disabled={loading}
                    />
                </div>
            </CardBorder>

            {/* Gerenciamento de convites */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-4">Código de Convite</h3>

                <p className="text-indigo-300 mb-4">
                    Gerencie o código de convite para permitir que jogadores entrem na campanha.
                </p>

                <div className="bg-indigo-900/30 p-4 rounded border border-indigo-800">
                    <h4 className="font-medium text-indigo-200 mb-2">📋 Informações:</h4>
                    <ul className="text-sm text-indigo-300 space-y-1">
                        <li>• O código atual é: <span className="font-mono text-white">{campaign.invite_code}</span></li>
                        <li>• Compartilhe com jogadores para eles entrarem</li>
                        <li>• Você pode regenerar o código se necessário</li>
                        <li>• Códigos antigos ficam inválidos ao gerar um novo</li>
                    </ul>
                </div>
            </CardBorder>

            {/* Informações da campanha */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-4">Informações Técnicas</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-indigo-400">ID da Campanha:</span>
                        <span className="text-white ml-2 font-mono">{campaign.id}</span>
                    </div>

                    <div>
                        <span className="text-indigo-400">Criada em:</span>
                        <span className="text-white ml-2">
                            {new Date(campaign.created_at).toLocaleString('pt-BR')}
                        </span>
                    </div>

                    <div>
                        <span className="text-indigo-400">Última atualização:</span>
                        <span className="text-white ml-2">
                            {new Date(campaign.updated_at).toLocaleString('pt-BR')}
                        </span>
                    </div>

                    <div>
                        <span className="text-indigo-400">Jogadores atuais:</span>
                        <span className="text-white ml-2">
                            {campaign.player_count || 0}/{campaign.max_players}
                        </span>
                    </div>
                </div>
            </CardBorder>

            {/* Zona de perigo */}
            <CardBorder className="bg-red-950/30 border-red-800">
                <h3 className="text-xl font-bold mb-4 text-red-200">⚠️ Zona de Perigo</h3>

                <p className="text-red-300 mb-4">
                    Ações irreversíveis que afetam permanentemente a campanha.
                </p>

                <div className="space-y-4">
                    <div>
                        <h4 className="font-medium text-red-200 mb-2">Deletar Campanha</h4>
                        <p className="text-red-300 text-sm mb-3">
                            Esta ação irá deletar permanentemente a campanha, todos os personagens associados
                            e histórico. Esta ação não pode ser desfeita.
                        </p>

                        <Button
                            buttonLabel="Deletar Campanha"
                            onClick={() => setShowDeleteModal(true)}
                            classname="bg-red-600 hover:bg-red-700"
                            disabled={loading}
                        />
                    </div>
                </div>
            </CardBorder>

            {/* Modal de confirmação de exclusão */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="⚠️ Confirmar Exclusão"
                size="md"
                footer={
                    <ModalConfirmFooter
                        onConfirm={handleDelete}
                        onCancel={() => setShowDeleteModal(false)}
                        confirmLabel={loading ? "Deletando..." : "Sim, Deletar"}
                        cancelLabel="Cancelar"
                        confirmVariant="bg-red-600 hover:bg-red-700"
                    />
                }
            >
                <div className="space-y-4">
                    <div className="bg-red-900/20 p-4 rounded border border-red-600/30">
                        <h4 className="font-bold text-red-200 mb-2">Esta ação é irreversível!</h4>
                        <p className="text-red-300 text-sm">
                            Ao deletar a campanha "{campaign.name}", você irá:
                        </p>
                        <ul className="text-red-300 text-sm mt-2 space-y-1">
                            <li>• Remover permanentemente a campanha</li>
                            <li>• Remover todos os personagens associados</li>
                            <li>• Invalidar o código de convite</li>
                            <li>• Perder todo o histórico e progresso</li>
                        </ul>
                    </div>

                    <div className="bg-indigo-900/30 p-4 rounded border border-indigo-800">
                        <p className="text-indigo-200 text-sm">
                            💡 <strong>Alternativa:</strong> Considere alterar o status para "Concluída"
                            em vez de deletar, para preservar o histórico da campanha.
                        </p>
                    </div>

                    <div>
                        <p className="text-white font-medium">
                            Digite o nome da campanha para confirmar a exclusão:
                        </p>
                        <input
                            type="text"
                            placeholder={campaign.name}
                            className="w-full mt-2 px-3 py-2 border border-red-600 rounded-md 
                       focus:outline-none focus:ring-2 focus:ring-red-500 
                       bg-red-900/20 text-white"
                            disabled={loading}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CampaignSettings;