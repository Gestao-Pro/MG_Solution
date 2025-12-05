

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
    const [downloading, setDownloading] = useState(false);

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
        try {
            setDownloading(true);
            setStatus('Gerando PDF...');
    
            const jspdfGlobal: any = (window as any).jspdf || (typeof jspdf !== 'undefined' ? jspdf : undefined);
            if (!jspdfGlobal || !jspdfGlobal.jsPDF) {
                console.error('jsPDF global not available.');
                setError('Biblioteca jsPDF não carregada. Verifique sua conexão e recarregue a página.');
                return;
            }
    
            const { jsPDF } = jspdfGlobal;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 20; // Margem aumentada para 20mm
            const contentWidth = pdfWidth - margin * 2;
            let currentY = 30; // Posição inicial Y ajustada
    
            // Array para armazenar o sumário
            const tableOfContents: { title: string, page: number }[] = [];
    
            // Definições de espaçamento
            const spaceAfterTitle = 15;
            const spaceAfterSubtitle = 8;
            const spaceAfterParagraph = 6;
            const spaceBeforeSection = 10;
    
            // Definições de Tipografia e Cores
            const FONT_TITLE = 24;
            const FONT_SECTION = 18;
            const FONT_SUBSECTION = 14;
            const FONT_BODY = 12;
            const FONT_VISUAL_TITLE = 10;
            const FONT_FOOTER = 8;
    
            const COLOR_PRIMARY = '#2c3e50';
            const COLOR_SECONDARY = '#3498db';
            const COLOR_BODY = '#34495e';
            const COLOR_MUTED = '#95a5a6';
            const COLOR_NEUTRAL = '#bdc3c7';
    
            const renderStyledText = (text: string, initialX: number, maxWidth: number) => {
                const lineHeight = 5;
                const lines = pdf.splitTextToSize(text, maxWidth);
            
                for (const line of lines) {
                    if (currentY + lineHeight > pdfHeight - 20) {
                        pdf.addPage();
                        currentY = margin; // Reset Y on new page
                    }
            
                    let currentX = initialX;
                    // Regex to split by **bold** or *italic* while keeping the delimiters for identification
                    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g).filter(p => p);
            
                    for (const part of parts) {
                        let style = 'normal';
                        let content = part;
            
                        if (part.startsWith('**') && part.endsWith('**')) {
                            style = 'bold';
                            content = part.substring(2, part.length - 2);
                        } else if (part.startsWith('*') && part.endsWith('*')) {
                            style = 'italic';
                            content = part.substring(1, part.length - 1);
                        }
            
                        // Set the font style for this part
                        pdf.setFont('helvetica', style);
                        
                        // Render the part and update the X position
                        pdf.text(content, currentX, currentY);
                        currentX += pdf.getStringUnitWidth(content) * pdf.getFontSize() / pdf.internal.scaleFactor;
                    }
                    currentY += lineHeight; // Move to the next line
                }
            };
    
            // --- CAPA PROFISSIONAL ---
            // Fundo da capa
            pdf.setFillColor(COLOR_PRIMARY); // Azul escuro
            pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    
            // Título Principal
            pdf.setFontSize(32);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor('#FFFFFF'); // Branco
            pdf.text('Relatório de Análise Estratégica', pdfWidth / 2, 80, { align: 'center' });
    
            // Subtítulo
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Projeto GestãoPro', pdfWidth / 2, 100, { align: 'center' });
    
            // Logo da Empresa (Placeholder)
            // pdf.addImage(userProfile.companyLogo, 'PNG', pdfWidth / 2 - 25, 130, 50, 50);
    
            // Informações do Cliente e Data
            pdf.setFontSize(14);
            pdf.setTextColor('#FFFFFF');
            pdf.text(userProfile.companyName, pdfWidth / 2, 180, { align: 'center' });
            const currentDate = new Date().toLocaleDateString('pt-BR');
            pdf.text(currentDate, pdfWidth / 2, 190, { align: 'center' });
    
            // --- FIM DA CAPA ---
    
            // --- PÁGINA DO SUMÁRIO (Placeholder) ---
            pdf.addPage();
            const tocPage = pdf.internal.getNumberOfPages(); // Página onde o sumário será inserido
            pdf.setFontSize(FONT_SECTION);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(COLOR_PRIMARY);
            pdf.text('Sumário', margin, currentY);
            currentY += spaceAfterTitle;
    
            // Adicionar nova página para o conteúdo
            pdf.addPage();
            currentY = margin + 10; // Reset Y para a nova página
    
            // --- RESUMO EXECUTIVO ---
            let sectionCounter = 1;
            tableOfContents.push({ title: `${sectionCounter}. Resumo Executivo`, page: pdf.internal.getNumberOfPages() });
            pdf.setFontSize(FONT_SECTION);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(COLOR_PRIMARY);
            pdf.text(`${sectionCounter}. Resumo Executivo`, margin, currentY);
            currentY += spaceAfterTitle;
    
            pdf.setFontSize(FONT_BODY);
            pdf.setTextColor(COLOR_BODY);
            renderStyledText(reportData.rewrittenProblem, margin, contentWidth);
            currentY += spaceAfterParagraph;
    
    
            // --- RECOMENDAÇÕES DOS ESPECIALISTAS ---
            currentY += spaceBeforeSection;
            sectionCounter++;
            let subsectionCounter = 0;
            tableOfContents.push({ title: `${sectionCounter}. Recomendações dos Especialistas`, page: pdf.internal.getNumberOfPages() });
            pdf.setFontSize(FONT_SECTION);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(COLOR_PRIMARY);
            pdf.text(`${sectionCounter}. Recomendações dos Especialistas`, margin, currentY);
            currentY += spaceAfterTitle;
    
            // Loop pelas soluções para renderizar no PDF
            for (const sol of reportData.rewrittenSolutions) {
                // Verificar espaço para nova recomendação
                if (currentY + spaceBeforeSection > pdfHeight - 20) {
                    pdf.addPage();
                    currentY = 30;
                }
                currentY += spaceBeforeSection;
    
                // Nome do agente (Subseção)
                subsectionCounter++;
                pdf.setFontSize(FONT_SUBSECTION);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(COLOR_SECONDARY);
                pdf.text(`${sectionCounter}.${subsectionCounter}. ${sol.agent.name}:`, margin, currentY);
                currentY += spaceAfterSubtitle;
    
                // Conteúdo da recomendação
                pdf.setFontSize(FONT_BODY);
                pdf.setTextColor(COLOR_BODY);
                renderStyledText(sol.rewrittenSolution, margin, contentWidth);
                currentY += spaceAfterParagraph;
    
                // Adicionar visual (se existir)
                if (sol.visualUrl) {
                    try {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.src = sol.visualUrl;
                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                        });
    
                        // Calcular tamanho da imagem para caber no conteúdo
                        const maxImgHeight = pdfHeight * 0.4; // Max 40% of page height
                        let imgWidth = contentWidth;
                        let imgHeight = (img.height / img.width) * imgWidth;
    
                        if (imgHeight > maxImgHeight) {
                            imgHeight = maxImgHeight;
                            imgWidth = (img.width / img.height) * imgHeight; // Recalcular largura para manter a proporção
                            if (imgWidth > contentWidth) { // Garantir que a largura não exceda o contentWidth
                                imgWidth = contentWidth;
                                imgHeight = (img.height / img.width) * imgWidth;
                            }
                        }
    
                        if (currentY + imgHeight > pdfHeight - 20) {
                            pdf.addPage();
                            currentY = margin;
                        }
                        pdf.addImage(img, 'PNG', margin + (contentWidth - imgWidth) / 2, currentY, imgWidth, imgHeight); // Centralizar imagem
                        currentY += imgHeight + 5;
    
                        // Título do visual
                        if (sol.visualTitle) {
                            pdf.setFontSize(FONT_VISUAL_TITLE);
                            pdf.setTextColor(COLOR_MUTED);
                            pdf.text(sol.visualTitle, pdfWidth / 2, currentY, { align: 'center' });
                            currentY += 5;
                        }
                    } catch (e) {
                        console.error(`Falha ao adicionar visual para ${sol.agent.name}:`, e);
                    }
                }
    
                currentY += spaceAfterParagraph;
            }
    
            // --- CONCLUSÃO E PRÓXIMOS PASSOS ---
            currentY += spaceBeforeSection;
            sectionCounter++;
            tableOfContents.push({ title: `${sectionCounter}. Conclusão e Próximos Passos`, page: pdf.internal.getNumberOfPages() });
            pdf.setFontSize(FONT_SECTION);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(COLOR_PRIMARY);
            pdf.text(`${sectionCounter}. Conclusão e Próximos Passos`, margin, currentY);
            currentY += spaceAfterTitle;
    
            pdf.setFontSize(FONT_BODY);
            pdf.setTextColor(COLOR_BODY);
            const conclusionText = `Este relatório apresentou uma análise estratégica detalhada, destacando os principais desafios e oportunidades para a ${userProfile.companyName}. As recomendações fornecidas pelos nossos especialistas oferecem um caminho claro para otimizar operações, fortalecer o posicionamento de mercado e impulsionar o crescimento sustentável.\n\nSugerimos os seguintes próximos passos:\n*1. Reunião de Alinhamento:* Agendar uma reunião com as partes interessadas para discutir os insights deste relatório e priorizar as ações recomendadas.\n*2. Plano de Ação Detalhado:* Desenvolver um plano de ação com cronogramas, responsáveis e métricas de sucesso (KPIs) para cada iniciativa.\n*3. Projetos-Piloto:* Iniciar com projetos-piloto para as recomendações de maior impacto e menor complexidade, permitindo uma validação rápida e ajustes ágeis.\n*4. Monitoramento Contínuo:* Estabelecer um ciclo de revisão trimestral para acompanhar o progresso das iniciativas e o impacto nos resultados da empresa.`;
            renderStyledText(conclusionText, margin, contentWidth);
            currentY += spaceAfterParagraph;
    
            // --- RENDERIZAR O SUMÁRIO DE VERDADE ---
            pdf.setPage(tocPage);
            currentY = 30 + spaceAfterTitle; // Posição Y inicial da página do sumário
            pdf.setFontSize(FONT_BODY);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(COLOR_BODY);
    
            for (const item of tableOfContents) {
                if (currentY > pdfHeight - 20) { // Evitar que o sumário ultrapasse a página
                    // Idealmente, adicionar nova página de sumário se for muito longo
                    break;
                }
                const title = item.title;
                const pageNum = item.page.toString();
                const titleWidth = pdf.getStringUnitWidth(title) * pdf.getFontSize() / pdf.internal.scaleFactor;
                const pageNumWidth = pdf.getStringUnitWidth(pageNum) * pdf.getFontSize() / pdf.internal.scaleFactor;
                const dotsWidth = contentWidth - titleWidth - pageNumWidth;
                const dots = '.'.repeat(Math.max(0, Math.floor(dotsWidth / (pdf.getStringUnitWidth('.') * pdf.getFontSize() / pdf.internal.scaleFactor))));
    
                pdf.text(title, margin, currentY);
                pdf.text(dots, margin + titleWidth, currentY);
                pdf.text(pageNum, pdfWidth - margin, currentY, { align: 'right' });
                currentY += 8; // Espaçamento entre itens do sumário
            }
    
            // 5. Adicionar Cabeçalhos e Rodapés em todas as páginas
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
    
                // Cabeçalho simplificado (apenas a linha)
                pdf.setDrawColor('#aaccff');
                pdf.line(margin, 12, pdfWidth - margin, 12);
    
                // Rodapé simplificado
                pdf.setFontSize(FONT_FOOTER);
                pdf.setTextColor(COLOR_NEUTRAL); // Cinza neutro
                const pageNumText = `Página ${i} de ${totalPages}`;
                const confidentialityText = 'Confidencial © GestãoPro';
                pdf.text(confidentialityText, margin, pdfHeight - 10);
                pdf.text(pageNumText, pdfWidth - margin, pdfHeight - 10, { align: 'right' });
    
                // Marca d'água corrigida
                pdf.saveGraphicsState();
                pdf.setGState(new jspdfGlobal.GState({ opacity: 0.08 }));
                pdf.setFontSize(45); // Tamanho de fonte reduzido
                pdf.setTextColor('#C0C0C0');
                pdf.text('CONFIDENCIAL', pdfWidth / 2, pdfHeight / 2, { align: 'center', angle: 45 });
                pdf.restoreGraphicsState();
            }
    
            // 6. Salvar o PDF
            pdf.save(`relatorio-gestaopro-${userProfile.companyName.toLowerCase().replace(/\s/g, '-')}.pdf`);
            setStatus('Relatório pronto!');
        } catch (e) {
            console.error('Falha ao gerar PDF:', e);
            setError('Falha ao gerar o PDF. Tente novamente e, se persistir, recarregue a página.');
        } finally {
            setDownloading(false);
        }
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
                                disabled={loading || !!error || downloading}
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
            {/* ReportPDFLayout is no longer needed for PDF generation as content is directly added to jsPDF */}
            {/*
                 <div style={{ position: 'absolute', left: '-9999px', top: '0px' }}>
                     <ReportPDFLayout 
                         reportData={reportData}
                         userProfile={userProfile}
                     />
                 </div>
            */}
        </>
    );
};

export default ReportModal;