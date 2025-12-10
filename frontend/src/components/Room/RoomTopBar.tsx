import React from 'react';
import { Menu, RefreshCw, Save, ArrowLeft } from 'lucide-react';
import { Button } from '../../ui';
import { useNavigate } from 'react-router-dom';

interface RoomTopBarProps {
    roomId: string;
    roomName: string | undefined;
    campaignId?: number;
    socketConnected: boolean;
    loading: boolean;
    onToggleSidebar: () => void;
    onSaveScene: (e: React.FormEvent) => void;
    onReload: () => void;
}

export const RoomTopBar: React.FC<RoomTopBarProps> = ({
    roomId,
    roomName,
    campaignId,
    socketConnected,
    loading,
    onToggleSidebar,
    onSaveScene,
    onReload,
}) => {
    const navigate = useNavigate();

    return (
        <div className="fixed top-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 shadow-lg">
            <div className="flex items-center justify-between px-4 py-3">
                {/* Left: Título e Status */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleSidebar}
                        className="text-white hover:text-indigo-300 transition-colors p-2 hover:bg-slate-800 rounded"
                        title="Abrir painel de controle"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg md:text-xl font-bold text-white">
                                {roomName || 'Carregando sala...'}
                            </h1>
                            <span
                                className={`flex items-center gap-2 text-xs px-2 py-1 rounded-full ${
                                    socketConnected
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-red-500/20 text-red-300'
                                }`}
                            >
                                <span
                                    className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-red-400'}`}
                                />
                                {socketConnected ? 'Conectado' : 'Offline'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">Sala #{roomId}</p>
                    </div>
                </div>

                {/* Right: Ações */}
                <div className="flex items-center gap-2">
                    {campaignId && (
                        <Button
                            buttonLabel={
                                <div className="flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="hidden md:inline">Voltar</span>
                                </div>
                            }
                            onClick={(e) => {
                                e.preventDefault();
                                navigate(`/campaigns/${campaignId}`);
                            }}
                            classname="bg-slate-700 hover:bg-slate-600"
                        />
                    )}
                    <Button
                        buttonLabel={
                            <div className="flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                <span className="hidden md:inline">Salvar</span>
                            </div>
                        }
                        onClick={onSaveScene}
                        classname="bg-green-700 hover:bg-green-600"
                        disabled={loading}
                    />
                    <Button
                        buttonLabel={
                            <div className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                <span className="hidden md:inline">Recarregar</span>
                            </div>
                        }
                        onClick={(e) => {
                            e.preventDefault();
                            onReload();
                        }}
                        classname="bg-slate-700 hover:bg-slate-600"
                    />
                </div>
            </div>
        </div>
    );
};
