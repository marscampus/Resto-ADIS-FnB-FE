import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
// import Swal from 'sweetalert2';
import { Button } from 'primereact/button';
import 'react-pdf/dist/esm/Page/TextLayer.css';

function PDFViewer({ pdfUrl, paperSize }) {
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageWidth, setPageWidth] = useState(0);
    const [pageHeight, setPageHeight] = useState(0);
    const [scale, setScale] = useState(1);

    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

    const handleFirstPage = () => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < numPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleLastPage = () => {
        if (currentPage !== numPages) {
            setCurrentPage(numPages);
        }
    };

    const handleZoomIn = () => {
        if (scale < 2.0) {
            setScale(scale + 0.1);
        }
    };

    const handleZoomOut = () => {
        if (scale > 0.5) {
            setScale(scale - 0.1);
        }
    };

    const handleDownloadPDF = () => {
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = 'downloaded.pdf';
        downloadLink.click();
    };

    const handlePrint = () => {
        if (pdfUrl) {
            window.open(pdfUrl, '_blank');
        }
    };

    useEffect(() => {
        const loadPdf = async () => {
            try {
                const loadingTask = pdfjs.getDocument({ url: pdfUrl });
                const pdf = await loadingTask.promise;
                const pages = pdf.numPages;
                setNumPages(pages);

                const mmToPixel = 3.7795275591;
                let paperWidthInMm, paperHeightInMm;

                if (paperSize === 'A4') {
                    paperWidthInMm = 210;
                    paperHeightInMm = 297;
                } else if (paperSize === 'Letter') {
                    paperWidthInMm = 216;
                    paperHeightInMm = 279;
                } else if (paperSize === 'Legal') {
                    // Tambahkan pilihan Legal
                    paperWidthInMm = 216;
                    paperHeightInMm = 356;
                } else {
                    // Gunakan ukuran default jika pilihan tidak valid
                    paperWidthInMm = 216;
                    paperHeightInMm = 279;
                }

                setPageWidth(paperWidthInMm * mmToPixel);
                setPageHeight(paperHeightInMm * mmToPixel);
            } catch (error) {
                // Swal.fire({
                //     icon: 'error',
                //     title: 'Error',
                //     text: 'Error loading PDF: ' + error.message
                // });
            }
        };

        if (pdfUrl) {
            loadPdf();
        }
    }, [pdfUrl, paperSize]);

    return (
        <div>
            {pdfUrl && numPages !== null && (
                <div>
                    <div
                        style={{
                            // display: 'flex',
                            backgroundColor: '#f0f0f0',
                            padding: '10px',
                            borderRadius: '5px',
                            boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.3)',
                            position: 'sticky',
                            top: '0',
                            zIndex: '1000',
                            width: '100%'
                        }}
                    >
                        <Button label="" icon="pi pi-angle-double-left" style={{ margin: '5px' }} onClick={handleFirstPage} disabled={currentPage === 1} className="p-button-secondary pdf-toolbar-button" />
                        <Button label="" icon="pi pi-angle-left" style={{ margin: '5px' }} onClick={handlePrevPage} disabled={currentPage === 1} className="p-button-secondary pdf-toolbar-button" />
                        <Button label="" icon="pi pi-search-plus" style={{ margin: '5px' }} onClick={handleZoomIn} disabled={scale >= 2.0} className="p-button-info pdf-toolbar-button" />
                        <Button label="" icon="pi pi-search-minus" style={{ margin: '5px' }} onClick={handleZoomOut} disabled={scale <= 0.5} className="p-button-info pdf-toolbar-button" />
                        <Button label="" icon="pi pi-angle-right" style={{ margin: '5px' }} onClick={handleNextPage} disabled={currentPage === numPages} className="p-button-secondary pdf-toolbar-button" />
                        <Button label="" icon="pi pi-angle-double-right" style={{ margin: '5px' }} onClick={handleLastPage} disabled={currentPage === numPages} className="p-button-secondary pdf-toolbar-button" />
                        <Button label="" icon="pi pi-download" style={{ margin: '5px' }} onClick={handleDownloadPDF} className="p-button-success pdf-toolbar-button" />
                        <Button label="" icon="pi pi-print" style={{ margin: '5px' }} onClick={handlePrint} className="p-button-success pdf-toolbar-button" />
                    </div>
                    <div style={{ overflow: 'auto', height: '59vh', display: 'flex', paddingTop: '10%', justifyContent: 'center', alignItems: 'center' }}>
                        <div className="pdf-canvas" style={{ background: 'lightgray', marginTop: '640px', padding: '10px' }}>
                            <div className="pdf-frame" style={{ border: 'none', padding: '0px', maxWidth: '100%', maxHeight: '100%' }}>
                                <Document file={pdfUrl}>
                                    <Page pageNumber={currentPage} width={pageWidth} height={pageHeight} scale={scale} />
                                </Document>
                            </div>
                        </div>
                    </div>
                    <div
                        className="pdf-page-info"
                        style={{
                            textAlign: 'center',
                            marginTop: '10px',
                            color: 'gray',
                            fontSize: '12px'
                        }}
                    >
                        Page {currentPage} of {numPages}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PDFViewer;
