// frontend/src/components/Campaigns/JoinCampaignModal.tsx
import React, { useState } from 'react';
import { Modal, ModalConfirmFooter, Alert } from '../../ui';
import { campaignService } from '../../services/campaignService';

interface JoinCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const JoinCampaignModal: React.FC<JoinCampaignModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const formatInviteCode = (value: string) => {
        // Remove tudo que não é letra ou número
        const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

        // Adiciona hífen após 4 caracteres
        if (cleaned.length > 4) {
            return cleaned.slice(0, 4) + '-' + cleaned.slice(4, 8);
        }

        return cleaned;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatInviteCode(e.target.value);
        setInviteCode(formatted);
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async () => {
        const cleanCode = inviteCode.replace('-', '');

        if (!cleanCode || cleanCode.length !== 8) {
            setError('Código de convite deve ter 8 caracteres (formato: ABCD-1234)');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            const response = await campaignService.joinCampaign(inviteCode);
            setSuccess(response.message || 'Entrou na campanha com sucesso!');

            // Aguarda um pouco para mostrar a mensagem de sucesso
            setTimeout(() => {
                setInviteCode('');
                setSuccess(null);
                onSuccess();
            }, 2000);

        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao entrar na campanha. Verifique o código e tente novamente.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setInviteCode('');
            setError(null);
            setSuccess(null);
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Entrar em Campanha"
            size="md"
            footer={
                <ModalConfirmFooter
                    onConfirm={handleSubmit}
                    onCancel={handleClose}
                    confirmLabel={loading ? "Entrando..." : "Entrar na Campanha"}
                    cancelLabel="Cancelar"
                    confirmVariant="bg-green-600 hover:bg-green-700"
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

                {success && (
                    <Alert
                        message={success}
                        variant="success"
                    />
                )}

                <div>
                    <label className="block text-indigo-200 mb-2 font-medium">
                        Código de Convite
                    </label>
                    <input
                        type="text"
                        value={inviteCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                     focus:outline-none focus:ring-2 focus:ring-green-500 
                     bg-indigo-900/50 text-white text-center text-lg font-mono tracking-wider"
                        placeholder="ABCD-1234"
                        maxLength={9}
                        disabled={loading || !!success}
                    />
                    <div className="text-xs text-indigo-400 mt-1">
                        Digite o código de 8 caracteres fornecido pelo Mestre
                    </div>
                </div>

                <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-800">
                    <h4 className="font-medium text-indigo-200 mb-2">📋 Como obter o código:</h4>
                    <ul className="text-sm text-indigo-300 space-y-1">
                        <li>• Peça ao Mestre da campanha para compartilhar o código</li>
                        <li>• O código tem o formato: ABCD-1234 (4 letras/números + hífen + 4 letras/números)</li>
                        <li>• Códigos são únicos para cada campanha</li>
                        <li>• Após entrar, você poderá adicionar seus personagens</li>
                    </ul>
                </div>

                <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-600/30">
                    <h4 className="font-medium text-yellow-200 mb-2">⚠️ Importante:</h4>
                    <ul className="text-sm text-yellow-300 space-y-1">
                        <li>• Certifique-se de que o código está correto</li>
                        <li>• Alguns códigos podem ter limite de jogadores</li>
                        <li>• Você precisará criar/ter personagens para participar</li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
};

export default JoinCampaignModal;