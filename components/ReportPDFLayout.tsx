
import React from 'react';
import { UserProfile, Agent } from '../types';
import Avatar from './Avatar';

interface RewrittenSolution {
    agent: Agent;
    rewrittenSolution: string;
    visualUrl?: string;
    visualTitle?: string;
}
interface ReportData {
    rewrittenProblem: string;
    rewrittenSolutions: RewrittenSolution[];
}

interface ReportPDFLayoutProps {
    reportData: ReportData;
    userProfile: UserProfile;
}

const ReportPDFLayout: React.FC<ReportPDFLayoutProps> = ({ reportData, userProfile }) => {
    const today = new Date().toLocaleDateString('pt-BR');

    // Simple markdown to HTML for bullet points
    const renderSolution = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*.*?(?:\n|$))/g).filter(p => p && p.trim());
        return parts.map((part, index) => {
            const match = part.match(/\*\*(.*?):\*\*/);
            if (match) {
                const title = match[1];
                const content = part.replace(`**${title}:**`, '').trim();
                const listItems = content.split(/\s*\*\s/g).filter(item => item.trim());
                 if (listItems.length > 1) {
                    return (
                        <div key={index} className="mb-4">
                            <p><strong className="font-bold">{title}:</strong> {listItems[0]}</p>
                            <ul className="list-disc pl-8 mt-2 space-y-1">
                                {listItems.slice(1).map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    );
                }
                return (
                    <p key={index} className="mb-2">
                        <strong className="font-bold">{title}:</strong> {content}
                    </p>
                );
            }
            if (part.startsWith('* ')) {
                return <li key={index} className="mb-2">{part.substring(2)}</li>;
            }
            return <p key={index} className="mb-4">{part}</p>;
        });
    };

    return (
        // A4 size: 210mm x 297mm.
        <div className="bg-white text-gray-900 font-sans" style={{ width: '210mm' }}>
            {/* Page 1: Cover */}
            <div id="pdf-cover" style={{ height: '297mm', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                <h1 className="text-5xl font-bold text-blue-700">GestãoPro</h1>
                <h2 className="text-3xl font-light mt-4">Relatório de Análise Estratégica</h2>
                <div className="mt-20 text-center">
                    <p className="text-xl">Preparado para:</p>
                    <p className="text-2xl font-semibold">{userProfile.companyName}</p>
                </div>
                <p className="mt-auto text-lg">{today}</p>
            </div>

            {/* Subsequent Pages Content */}
            <div id="pdf-body">
                <main>
                    <section className="mb-12 page-break-inside-avoid">
                        <h3 className="text-2xl font-bold text-blue-700 border-b-2 border-blue-200 pb-2 mb-4">Resumo Executivo</h3>
                        <p className="text-lg leading-relaxed">{reportData.rewrittenProblem}</p>
                    </section>
                    
                    <section>
                        <h3 className="text-2xl font-bold text-blue-700 border-b-2 border-blue-200 pb-2 mb-8">Recomendações dos Especialistas</h3>
                        {reportData.rewrittenSolutions.map(({ agent, rewrittenSolution, visualUrl, visualTitle }, index) => (
                            <div key={index} className="mb-10 page-break-inside-avoid">
                                <div className="flex items-center mb-4 p-4 bg-gray-100 rounded-lg">
                                    <div className="w-16 h-16 mr-4 flex-shrink-0">
                                        <Avatar agent={agent} />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{agent.name}</p>
                                        <p className="text-md text-gray-600">{agent.specialty}</p>
                                    </div>
                                </div>
                                <div className="pl-4 text-lg leading-relaxed space-y-2">
                                    {renderSolution(rewrittenSolution)}
                                </div>
                                {visualUrl && (
                                    <div className="mt-6 border-t pt-6 page-break-inside-avoid">
                                        <h4 className="font-semibold text-lg mb-2 text-gray-700">Ilustração da Proposta: <span className="font-normal italic">{visualTitle}</span></h4>
                                        <img 
                                            src={visualUrl} 
                                            alt={visualTitle || `Visual para a solução de ${agent.name}`} 
                                            className="w-full max-w-2xl mx-auto rounded-lg shadow-md border"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </section>
                </main>
            </div>
            
            {/* Styles for PDF generation hints */}
            {/* Fix: Removed unsupported "jsx" and "global" props from the style tag. */}
            <style>{`
                .page-break-inside-avoid {
                    page-break-inside: avoid;
                }
            `}</style>
        </div>
    );
};

export default ReportPDFLayout;
