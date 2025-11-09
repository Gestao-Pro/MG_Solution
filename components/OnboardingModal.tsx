import React, { useState } from 'react';
import { UserProfile } from '../types';

interface OnboardingModalProps {
    onSave: (profile: UserProfile) => void;
    initialProfile?: UserProfile;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onSave, initialProfile }) => {
    const [profile, setProfile] = useState<UserProfile>(initialProfile ?? {
        userName: '',
        companyName: '',
        companyField: '',
        userRole: '',
        companySize: '',
        companyStage: '',
        mainProduct: '',
        targetAudience: '',
        mainChallenge: '',
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(profile);
    };

    const isFormValid = () => {
        // Fix: Check if the value is a string before calling .trim() to resolve TypeScript error.
        return Object.values(profile).every(value => typeof value === 'string' && value.trim() !== '');
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-2xl w-full border border-gray-300 dark:border-gray-700">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bem-vindo ao GestãoPro!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Para personalizar sua experiência, precisamos entender melhor seu negócio. Quanto mais detalhes, melhores serão as soluções.</p>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="userName">Seu Nome</label>
                            <input type="text" id="userName" name="userName" value={profile.userName} onChange={handleChange} required className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ex: Maria Silva" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="userRole">Seu Cargo</label>
                            <input type="text" id="userRole" name="userRole" value={profile.userRole} onChange={handleChange} required className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ex: Sócio-fundador, Gerente de Marketing"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="companyName">Nome da Empresa</label>
                            <input type="text" id="companyName" name="companyName" value={profile.companyName} onChange={handleChange} required className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="companyField">Ramo de Atuação</label>
                            <input type="text" id="companyField" name="companyField" value={profile.companyField} onChange={handleChange} required className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ex: E-commerce de moda, SaaS B2B" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="companySize">Porte da Empresa</label>
                            <select id="companySize" name="companySize" value={profile.companySize} onChange={handleChange} required className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                <option value="">Selecione...</option>
                                <option value="Eu sozinho(a)">Eu sozinho(a)</option>
                                <option value="2-10 funcionários">2-10 funcionários</option>
                                <option value="11-50 funcionários">11-50 funcionários</option>
                                <option value="51-200 funcionários">51-200 funcionários</option>
                                <option value="Mais de 200 funcionários">Mais de 200 funcionários</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="companyStage">Tempo de Mercado</label>
                            <select id="companyStage" name="companyStage" value={profile.companyStage} onChange={handleChange} required className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                <option value="">Selecione...</option>
                                <option value="Menos de 1 ano">Menos de 1 ano</option>
                                <option value="1-3 anos">1-3 anos</option>
                                <option value="3-5 anos">3-5 anos</option>
                                <option value="Mais de 5 anos">Mais de 5 anos</option>
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="mainProduct">Principal Produto/Serviço</label>
                        <textarea id="mainProduct" name="mainProduct" value={profile.mainProduct} onChange={handleChange} required rows={2} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Descreva brevemente o que sua empresa vende."></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="targetAudience">Público-Alvo</label>
                        <textarea id="targetAudience" name="targetAudience" value={profile.targetAudience} onChange={handleChange} required rows={2} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Para quem sua empresa vende? (Ex: Pequenas empresas de tecnologia, jovens de 18-25 anos)"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="mainChallenge">Seu Maior Desafio Empresarial</label>
                        <textarea id="mainChallenge" name="mainChallenge" value={profile.mainChallenge} onChange={handleChange} required rows={3} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Qual o principal obstáculo ou objetivo que você quer resolver com nossa ajuda? (Ex: Aumentar as vendas, organizar processos internos, criar uma estratégia de marketing)"></textarea>
                    </div>

                    <button type="submit" disabled={!isFormValid()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {initialProfile ? 'Salvar' : 'Salvar e Iniciar'}
                    </button>
                </form>
            </div>
             <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-track {
                    background: #2d3748;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #4a5568;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #718096;
                }
            `}</style>
        </div>
    );
};

export default OnboardingModal;