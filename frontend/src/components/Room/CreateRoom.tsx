import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Alert, Button, CardBorder, Page, Section } from '../../ui';
import roomService from '../../services/roomService';

const CreateRoom: React.FC = () => {
    const [name, setName] = useState('Sala do Mestre');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            const room = await roomService.createRoom(name);
            navigate(`/rooms/${room.id}`);
        } catch (err) {
            setError('Nao foi possivel criar a sala');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Page>
            <Section title="Criar sala de jogo" className="pt-12">
                <div className="max-w-3xl mx-auto">
                    {error && <Alert message={error} variant="error" onClose={() => setError(null)} />}

                    <CardBorder className="bg-slate-900/60">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm text-indigo-200">Nome da sala</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Mesa da campanha"
                                />
                                <p className="text-xs text-slate-300">
                                    O estado e mantido em memoria. Ao reiniciar o servidor, a sala sera perdida.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    buttonLabel={loading ? 'Criando...' : 'Criar sala'}
                                    onClick={handleSubmit}
                                    type="submit"
                                    disabled={loading}
                                    classname="bg-purple-700 hover:bg-purple-600"
                                />
                                <Link to="/" className="inline-block">
                                    <Button
                                        buttonLabel="Voltar"
                                        onClick={(e) => e.preventDefault()}
                                        classname="bg-slate-700 hover:bg-slate-600"
                                    />
                                </Link>
                            </div>
                        </form>
                    </CardBorder>
                </div>
            </Section>
        </Page>
    );
};

export default CreateRoom;
