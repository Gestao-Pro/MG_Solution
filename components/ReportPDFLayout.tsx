
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
        <div style={{ backgroundColor: '#FFFFFF', color: '#1A202C', fontFamily: 'sans-serif', width: '210mm' }}>
            {/* Page 1: Cover */}
            <div id="pdf-cover" style={{ height: '297mm', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2B6CB0' }}>GestãoPro</h1>
                <h2 style={{ fontSize: '1.875rem', fontWeight: '300', marginTop: '1rem' }}>Relatório de Análise Estratégica</h2>
                <div style={{ marginTop: '5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.25rem' }}>Preparado para:</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>{userProfile.companyName}</p>
                </div>
                <p style={{ marginTop: 'auto', fontSize: '1.125rem' }}>{today}</p>
            </div>

            {/* Subsequent Pages Content */}
            <div id="pdf-body">
                <main>
                    <section className="mb-12 page-break-inside-avoid">
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2B6CB0', borderBottom: '2px solid #BEE3F8', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Resumo Executivo</h3>
                        <p style={{ fontSize: '1.125rem', lineHeight: '1.625' }}>{reportData.rewrittenProblem}</p>
                    </section>
                    
                    <section>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2B6CB0', borderBottom: '2px solid #BEE3F8', paddingBottom: '0.5rem', marginBottom: '2rem' }}>Recomendações dos Especialistas</h3>
                        {reportData.rewrittenSolutions.map(({ agent, rewrittenSolution, visualUrl, visualTitle }, index) => (
                            <div key={index} className="mb-10 page-break-inside-avoid">
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', padding: '1rem', backgroundColor: '#F7FAFC', borderRadius: '0.5rem' }}>
                                    <div style={{ width: '4rem', height: '4rem', marginRight: '1rem', flexShrink: 0 }}>
                                        <Avatar agent={agent} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{agent.name}</p>
                                        <p style={{ fontSize: '1rem', color: '#4A5568' }}>{agent.specialty}</p>
                                    </div>
                                </div>
                                <div style={{ paddingLeft: '1rem', fontSize: '1.125rem', lineHeight: '1.625', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {renderSolution(rewrittenSolution)}
                                </div>
                                {visualUrl && (
                                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem', pageBreakInside: 'avoid' }}>
                                        <h4 style={{ fontWeight: '600', fontSize: '1.125rem', marginBottom: '0.5rem', color: '#2D3748' }}>Ilustração da Proposta: <span style={{ fontWeight: '400', fontStyle: 'italic' }}>{visualTitle}</span></h4>
                                        <img 
                                            src={visualUrl} 
                                            alt={visualTitle || `Visual para a solução de ${agent.name}`} 
                                            style={{ width: '100%', maxWidth: '40rem', margin: '0 auto', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #E2E8F0' }}
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
