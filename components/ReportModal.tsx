

import React, { useRef, useState, useEffect } from 'react';
import { Analysis, UserProfile } from '../types';
import IconButton from './IconButton';
import { X, Download, Loader } from 'lucide-react';
import { generatePdfReportContent, generateVisualForReport } from '../services/geminiService';
import ReportPDFLayout from './ReportPDFLayout';
import { ALL_AGENTS_MAP } from '../constants';


declare const jspdf: any;

interface ReportModalProps {
    analysis: Analysis;
    onClose: () => void;
    userProfile: UserProfile; // Add userProfile to props
}

interface RewrittenSolution {
    agent: any;
    rewrittenSolution: string;
    visualUrl?: string;
    visualTitle?: string;
}

interface ReportData {
    rewrittenProblem: string;
    rewrittenSolutions: RewrittenSolution[];
}

const ReportModal: React.FC<ReportModalProps> = ({ analysis, onClose, userProfile }) => {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('Iniciando a geração do relatório...');
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generateReport = async () => {
            try {
                setStatus('Reescrevendo a análise em linguagem de negócios...');
                const { rewrittenProblem, rewrittenSolutions: solutionsFromApi } = await generatePdfReportContent(analysis, userProfile);
                
                setStatus('Identificando oportunidades para visuais...');
                const solutionsWithVisuals: RewrittenSolution[] = await Promise.all(
                    solutionsFromApi.map(async (sol) => {
                        const agent = ALL_AGENTS_MAP.get(sol.agentId);
                        if (!agent) return { ...sol, agent: null, visualUrl: undefined };
                        
                        let visualUrl: string | undefined;
                        if (sol.visualPrompt) {
                            setStatus(`Criando visual para a análise de ${agent.name}...`);
                            try {
                                visualUrl = await generateVisualForReport(sol.visualPrompt);
                            } catch (e) {
                                console.error(`Failed to generate visual for ${agent.name}:`, e);
                                // Non-fatal, continue without the image
                            }
                        }
                        return { 
                            agent, 
                            rewrittenSolution: sol.rewrittenSolution,
                            visualUrl,
                            visualTitle: sol.visualTitle,
                        };
                    })
                );

                setReportData({
                    rewrittenProblem,
                    rewrittenSolutions: solutionsWithVisuals.filter(s => s.agent),
                });
                setStatus('Relatório pronto!');

            } catch (err) {
                console.error("Failed to generate report content:", err);
                setError("Não foi possível gerar o relatório. Tente novamente mais tarde.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [analysis, userProfile]);
    
    const handleDownloadPdf = async () => {
        const coverElement = document.getElementById('pdf-cover');
        const bodyElement = document.getElementById('pdf-body');
        if (!coverElement || !bodyElement) {
            console.error("PDF content elements not found.");
            return;
        }

        const { jsPDF } = jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;

        // 1. Render Cover Page
        await pdf.html(coverElement, {
            width: pdfWidth,
            windowWidth: 794, // A4 width in pixels at 96 DPI
        });

        // 2. Add a new page for the body content
        pdf.addPage();
        
        // 3. Render Body Content with auto-paging
        await pdf.html(bodyElement, {
            autoPaging: 'text',
            y: margin,
            x: margin,
            width: pdfWidth - (margin * 2),
            windowWidth: 794 - (margin * 2),
        });

        // 4. Add Headers and Footers to body pages
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 2; i <= totalPages; i++) {
            pdf.setPage(i);
            
            // Header
            pdf.setFontSize(9);
            pdf.setTextColor('#003366'); // Dark Blue
            pdf.text('GestãoPro | Relatório de Análise Estratégica', margin, 10);
            pdf.setDrawColor('#aaccff'); // Light Blue
            pdf.line(margin, 12, pdfWidth - margin, 12);

            // Footer
            pdf.setFontSize(8);
            pdf.setTextColor(150); // Gray
            const pageStr = `Página ${i - 1} de ${totalPages - 1}`;
            pdf.text(pageStr, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
            pdf.text(`Confidencial © GestãoPro`, margin, pdfHeight - 10);
        }

        // 5. Save the PDF
        pdf.save(`relatorio-gestaopro-${userProfile.companyName.toLowerCase().replace(/\s/g, '-')}.pdf`);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col border border-gray-300 dark:border-gray-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Relatório Completo da Análise</h2>
                        <div className="flex items-center space-x-2">
                           <IconButton 
                                icon={Download} 
                                onClick={handleDownloadPdf} 
                                tooltip="Baixar Relatório (PDF)" 
                                className="bg-green-600 hover:bg-green-700 text-white" 
                                disabled={loading || !!error}
                            />
                            <IconButton icon={X} onClick={onClose} tooltip="Fechar" className="bg-red-600 hover:bg-red-700 text-white" />
                        </div>
                    </header>
                    <main className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                        {loading && (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Loader className="w-16 h-16 text-blue-500 animate-spin" />
                                <p className="mt-4 text-lg font-semibold">{status}</p>
                            </div>
                        )}
                        {error && (
                            <div className="flex flex-col items-center justify-center h-full text-red-500">
                                <p className="text-lg font-semibold">Erro!</p>
                                <p>{error}</p>
                            </div>
                        )}
                        {!loading && !error && reportData && (
                            <div className="text-center">
                                <h3 className="text-2xl font-bold mb-4">Seu relatório está pronto!</h3>
                                <p className="mb-6">Abaixo, uma prévia do conteúdo. Clique em "Baixar" para obter o PDF completo.</p>
                                <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-lg h-[50vh] overflow-y-auto">
                                   <div className="prose dark:prose-invert max-w-none text-left">
                                        <h4>Resumo Executivo</h4>
                                        <p>{reportData.rewrittenProblem}</p>
                                        <hr />
                                        <h4>Recomendações</h4>
                                        <ul>
                                           {reportData.rewrittenSolutions.map(sol => (
                                               <li key={sol.agent.id}><strong>{sol.agent.name}:</strong> {sol.rewrittenSolution.substring(0, 150)}...</li>
                                           ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
            
            {/* Hidden element for PDF rendering. It must be in the DOM to be rendered. */}
            {!loading && reportData && (
                 <div style={{ position: 'absolute', left: '-9999px', top: '0px' }}>
                     <ReportPDFLayout 
                         reportData={reportData}
                         userProfile={userProfile}
                     />
                 </div>
            )}
        </>
    );
};

export default ReportModal;