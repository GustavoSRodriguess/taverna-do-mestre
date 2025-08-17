import React, { useState, useEffect } from 'react';
import { Button, CardBorder, Badge, Modal, ModalConfirmFooter, Alert } from '../../ui';
import { campaignService, CampaignCharacter, UpdateCharacterData } from '../../services/campaignService';

interface CampaignCharactersProps {
    campaignId: number;
    characters: CampaignCharacter[];
    isDM: boolean;
    onCharactersChange: () => void;
}

const CampaignCharacters: React.FC<CampaignCharactersProps> = ({
    campaignId,
    characters,
    isDM,
    onCharactersChange
}) => {
    const [availablePCs, setAvailablePCs] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState<CampaignCharacter | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [selectedPCId, setSelectedPCId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<UpdateCharacterData>({
        current_hp: undefined,
        temp_ac: undefined,
        status: 'active',
        campaign_notes: ''
    });

    const loadAvailablePCs = async () => {
        try {
            console.log('Carregando PCs disponíveis para campanha:', campaignId);

            const response = await campaignService.getAvailableCharacters(campaignId);

            console.log('Resposta da API:', response);
            console.log('PCs disponíveis:', response.available_characters);

            setAvailablePCs(response.available_characters || []);

            if (!response.available_characters || response.available_characters.length === 0) {
                console.log('Nenhum PC disponível encontrado');
            } else {
                console.log(`${response.available_characters.length} PCs disponíveis encontrados`);
            }
        } catch (err: any) {
            console.error('Erro detalhado ao carregar PCs disponíveis:', err);
            console.error('Status:', err.status);
            console.error('Message:', err.message);
            setError(err.message || 'Erro ao carregar personagens disponíveis');
        }
    };
    useEffect(() => {
        if (showAddModal) {
            loadAvailablePCs();
        }
    }, [showAddModal, campaignId]);

    const handleAddCharacter = async () => {
        if (!selectedPCId) {
            setError('Selecione um personagem para adicionar');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            console.log('Adicionando personagem com ID:', selectedPCId, 'à campanha:', campaignId);

            await campaignService.addCharacterToCampaign(campaignId, { pc_id: selectedPCId });

            setShowAddModal(false);
            setSelectedPCId(null);
            onCharactersChange();
        } catch (err: any) {
            setError(err.message || 'Erro ao adicionar personagem');
        } finally {
            setLoading(false);
        }
    };

    const handleEditCharacter = (character: CampaignCharacter) => {
        setSelectedCharacter(character);
        setEditForm({
            current_hp: character.current_hp,
            temp_ac: character.temp_ac,
            status: character.status,
            campaign_notes: character.campaign_notes || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateCharacter = async () => {
        if (!selectedCharacter) return;

        try {
            setLoading(true);
            setError(null);

            await campaignService.updateCampaignCharacter(
                campaignId,
                selectedCharacter.id,
                editForm
            );

            setShowEditModal(false);
            setSelectedCharacter(null);
            onCharactersChange();
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar personagem');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveCharacter = async (characterId: number) => {
        if (!confirm('Tem certeza que deseja remover este personagem da campanha?')) {
            return;
        }

        try {
            setLoading(true);
            await campaignService.removeCampaignCharacter(campaignId, characterId);
            onCharactersChange();
        } catch (err: any) {
            setError(err.message || 'Erro ao remover personagem');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap = {
            active: { variant: 'success' as const, text: 'Ativo' },
            inactive: { variant: 'info' as const, text: 'Inativo' },
            dead: { variant: 'danger' as const, text: 'Morto' },
            retired: { variant: 'warning' as const, text: 'Aposentado' }
        };

        const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.active;
        return <Badge text={statusInfo.text} variant={statusInfo.variant} />;
    };

    return (
        <div>
            {error && (
                <Alert
                    message={error}
                    variant="error"
                    onClose={() => setError(null)}
                    className="mb-4"
                />
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                    Personagens da Campanha ({characters.length})
                </h3>

                <Button
                    buttonLabel="Adicionar Personagem"
                    onClick={() => setShowAddModal(true)}
                    classname="bg-green-600 hover:bg-green-700"
                />
            </div>

            {/* Lista de personagens */}
            {characters.length === 0 ? (
                <CardBorder className="text-center py-8 bg-indigo-950/50">
                    <div className="text-4xl mb-4">🎭</div>
                    <h4 className="text-lg font-bold mb-2">Nenhum personagem na campanha</h4>
                    <p className="text-indigo-300 mb-4">
                        Adicione personagens existentes à campanha para começar a aventura!
                    </p>
                    <Button
                        buttonLabel="Adicionar Primeiro Personagem"
                        onClick={() => setShowAddModal(true)}
                        classname="bg-green-600 hover:bg-green-700"
                    />
                </CardBorder>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {characters.map((character) => (
                        <CardBorder key={character.id} className="bg-indigo-950/80">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-lg text-white">
                                        {character.pc?.name || 'Nome não disponível'}
                                    </h4>
                                    <p className="text-indigo-300">
                                        {character.pc?.race} {character.pc?.class} - Nível {character.pc?.level}
                                    </p>
                                    <p className="text-indigo-400 text-sm">
                                        Jogador: {character.player?.username}
                                    </p>
                                </div>
                                {getStatusBadge(character.status)}
                            </div>

                            {/* Stats atuais */}
                            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                <div>
                                    <span className="text-indigo-400">HP:</span>
                                    <span className="text-white ml-2">
                                        {(character.current_hp ?? character.pc?.hp) || 0}/{character.pc?.hp || 0}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-indigo-400">CA:</span>
                                    <span className="text-white ml-2">
                                        {(character.temp_ac ?? character.pc?.ca) || 0}
                                        {character.temp_ac && character.temp_ac !== character.pc?.ca && (
                                            <span className="text-green-400"> (+{character.temp_ac - (character.pc?.ca || 0)})</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Notas da campanha */}
                            {character.campaign_notes && (
                                <div className="mb-4">
                                    <p className="text-indigo-400 text-sm mb-1">Notas:</p>
                                    <p className="text-indigo-200 text-sm bg-indigo-900/30 p-2 rounded">
                                        {character.campaign_notes}
                                    </p>
                                </div>
                            )}

                            {/* Ações */}
                            <div className="flex gap-2">
                                <Button
                                    buttonLabel="Editar"
                                    onClick={() => handleEditCharacter(character)}
                                    classname="flex-1 text-sm py-1"
                                />

                                {isDM && (
                                    <Button
                                        buttonLabel="Remover"
                                        onClick={() => handleRemoveCharacter(character.id)}
                                        classname="flex-1 text-sm py-1 bg-red-600 hover:bg-red-700"
                                    />
                                )}
                            </div>
                        </CardBorder>
                    ))}
                </div>
            )}

            {/* Modal para adicionar personagem */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Adicionar Personagem à Campanha"
                size="md"
                footer={
                    <ModalConfirmFooter
                        onConfirm={handleAddCharacter}
                        onCancel={() => setShowAddModal(false)}
                        confirmLabel={loading ? "Adicionando..." : "Adicionar"}
                        cancelLabel="Cancelar"
                        confirmVariant="bg-green-600 hover:bg-green-700"
                    />
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-indigo-200 mb-2 font-medium">
                            Selecione um Personagem
                        </label>

                        {availablePCs.length === 0 ? (
                            <div className="text-center py-8 bg-indigo-900/30 rounded border border-indigo-800">
                                <p className="text-indigo-300">Nenhum personagem disponível</p>
                                <p className="text-indigo-400 text-sm mt-2">
                                    Crie personagens primeiro na seção de Criação
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {availablePCs.map((pc) => (
                                    <div
                                        key={pc.id}
                                        className={`p-3 border rounded cursor-pointer transition-colors ${selectedPCId === pc.id
                                            ? 'border-purple-500 bg-purple-600/20'
                                            : 'border-indigo-700 bg-indigo-900/30 hover:bg-indigo-800/30'
                                            }`}
                                        onClick={() => setSelectedPCId(pc.id)}
                                    >
                                        <div className="font-medium text-white">{pc.name}</div>
                                        <div className="text-sm text-indigo-300">
                                            {pc.race} {pc.class} - Nível {pc.level}
                                        </div>
                                        <div className="text-xs text-indigo-400">
                                            HP: {pc.hp} | CA: {pc.ca}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Modal para editar personagem */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title={`Editar ${selectedCharacter?.pc?.name || 'Personagem'}`}
                size="md"
                footer={
                    <ModalConfirmFooter
                        onConfirm={handleUpdateCharacter}
                        onCancel={() => setShowEditModal(false)}
                        confirmLabel={loading ? "Salvando..." : "Salvar"}
                        cancelLabel="Cancelar"
                    />
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-indigo-200 mb-2">HP Atual</label>
                            <input
                                type="number"
                                value={editForm.current_hp || ''}
                                onChange={(e) => setEditForm({ ...editForm, current_hp: parseInt(e.target.value) || undefined })}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                         bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                min={0}
                                max={selectedCharacter?.pc?.hp || 100}
                            />
                            <div className="text-xs text-indigo-400 mt-1">
                                Máximo: {selectedCharacter?.pc?.hp || 0}
                            </div>
                        </div>

                        <div>
                            <label className="block text-indigo-200 mb-2">CA Temporária</label>
                            <input
                                type="number"
                                value={editForm.temp_ac || ''}
                                onChange={(e) => setEditForm({ ...editForm, temp_ac: parseInt(e.target.value) || undefined })}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                         bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                min={0}
                                max={30}
                            />
                            <div className="text-xs text-indigo-400 mt-1">
                                Base: {selectedCharacter?.pc?.ca || 0}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-indigo-200 mb-2">Status</label>
                        <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as UpdateCharacterData['status'] })}
                            className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                       bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                            <option value="dead">Morto</option>
                            <option value="retired">Aposentado</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-indigo-200 mb-2">Notas da Campanha</label>
                        <textarea
                            value={editForm.campaign_notes}
                            onChange={(e) => setEditForm({ ...editForm, campaign_notes: e.target.value })}
                            className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                       bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            rows={3}
                            placeholder="Adicione notas sobre o personagem nesta campanha..."
                            maxLength={500}
                        />
                        <div className="text-xs text-indigo-400 mt-1">
                            {editForm.campaign_notes?.length || 0}/500 caracteres
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CampaignCharacters;