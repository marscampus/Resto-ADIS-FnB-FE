import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TabView, TabPanel } from 'primereact/tabview';
import { formatCurrency } from './GeneralFunction/GeneralFunction';
const PembayaranInvoice = ({ notaService, visible, onClose }) => {
    const [pdfDataUrlA4, setPdfDataUrlA4] = useState('');
    const [pdfDataUrlThermal, setPdfDataUrlThermal] = useState('');
    useEffect(() => {
        if (notaService && visible) {
            generatePDF('a4');
            generatePDF('thermal');
        }
    }, [notaService, visible]);
    const generatePDF = (version) => {
        if (!notaService) {
            console.error('NotaService is not available');
            return;
        }
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: version === 'a4' ? 'a4' : [80, 297]
        });
        const pageWidth = doc.internal.pageSize.width;
        const tableWidth = pageWidth - 20;
        const addPageNumbers = () => {
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            }
        };
        const formatDate = (date) => {
            const d = new Date(date);
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };
        if (version === 'a4') {
            // Company Information
            doc.setFontSize(11);
            doc.text('Company Name', pageWidth - 20, 20, { align: 'right' });
            doc.text('Company Address', pageWidth - 20, 25, { align: 'right' });
            doc.text('Company City, State, Zip', pageWidth - 20, 30, { align: 'right' });
            // Line separator
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(20, 35, pageWidth - 20, 35);
            // Customer Information
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Customer', 20, 42);
            doc.setFont('helvetica', 'normal');
            doc.text(notaService.PEMILIK, 20, 47);
            doc.text(notaService.NOTELEPON, 20, 52);
            // Invoice Details
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('INVOICE', pageWidth - 20, 42, { align: 'right' });
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`${notaService.FAKTUR}`, pageWidth - 20, 47, { align: 'right' });
            doc.text(`Date: ${formatDate(notaService.TGL)}`, pageWidth - 20, 52, { align: 'right' });
            doc.text(`Due Date: ${formatDate(notaService.ESTIMASISELESAI)}`, pageWidth - 20, 57, { align: 'right' });
            doc.text(`Work Order #: ${notaService.ANTRIAN || 'N/A'}`, pageWidth - 20, 62, { align: 'right' });
            let startY = 70;
            let overallTotal = 0;
            notaService.barangList?.forEach((barang, index) => {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`Barang ${index + 1}: ${barang.NAMA}`, 20, startY + 3);
                startY += 5;
                const services = barang.services.map((service) => [service.NAMA, service.QTY || 1, formatCurrency(service.HARGA), formatCurrency(service.HARGA * (service.QTY || 1))]);
                const subtotal = barang.services.reduce((acc, service) => acc + service.HARGA * (service.QTY || 1), 0);
                overallTotal += subtotal;
                services.push(['', '', 'Subtotal', formatCurrency(subtotal)]);
                autoTable(doc, {
                    startY: startY,
                    head: [['Description', 'Qty', 'Price', 'Amount']],
                    body: services,
                    theme: 'striped',
                    headStyles: { fillColor: [0, 0, 0] },
                    styles: { cellPadding: 1, fontSize: 10, halign: 'center' },
                    margin: { left: 20, right: 20 },
                    tableWidth: 'auto',
                    columnStyles: {
                        0: { cellWidth: 80, halign: 'left' },
                        1: { cellWidth: 10 },
                        2: { cellWidth: 40, halign: 'right' },
                        3: { cellWidth: 40, halign: 'right' }
                    }
                });
                startY = doc.lastAutoTable.finalY + 5;
                if (startY > doc.internal.pageSize.height - 60) {
                    doc.addPage();
                    startY = 5;
                }
            });
            const taxRate = 0.11;
            const taxAmount = overallTotal * taxRate;
            const totalWithTax = overallTotal + taxAmount;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            startY += 10;
            autoTable(doc, {
                startY: startY,
                body: [
                    ['', '', 'Subtotal', formatCurrency(overallTotal)],
                    ['', '', 'Tax (11%)', formatCurrency(taxAmount)],
                    ['', '', 'Total', formatCurrency(totalWithTax)]
                ],
                theme: 'striped',
                styles: { cellPadding: 1, fontSize: 10, halign: 'right' },
                margin: { left: 120, right: 20 },
                tableWidth: 'auto'
            });
            addPageNumbers();
            const pdfData = doc.output('datauristring');
            setPdfDataUrlA4(pdfData);
        } else if (version === 'thermal') {
            // Line Separator Function
            const drawSeparator = (yPos) => {
                doc.setLineDashPattern([1, 1], 0);
                doc.setLineWidth(0.1);
                doc.setDrawColor(0, 0, 0);
                doc.line(10, yPos, pageWidth - 10, yPos);
            };
            // Centered Header with Company Information
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Company Name', pageWidth / 2, 10, { align: 'center' });
            doc.setFontSize(10);
            doc.text('Company Address', pageWidth / 2, 15, { align: 'center' });
            doc.text('City, State, Zip', pageWidth / 2, 20, { align: 'center' });
            // Line separator
            drawSeparator(24);
            // Invoice Title
            doc.setFontSize(12);
            doc.text('INVOICE', pageWidth / 2, 30, { align: 'center' });
            // Invoice and Customer Information
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Date: ${formatDate(notaService.TGL)}`, 10, 40);
            doc.text(`Faktur: ${notaService.FAKTUR}`, 10, 45);
            doc.text('Customer:', 10, 55);
            doc.text(notaService.PEMILIK, 10, 60);
            doc.text(notaService.NOTELEPON, 10, 65);
            drawSeparator(70);
            const tableTop = 80;
            doc.setFont('helvetica', 'bold');
            doc.text('Qty', 10, tableTop);
            doc.text('Price', 40, tableTop, { align: 'right' });
            doc.text('Amount', 70, tableTop, { align: 'right' });
            // Table Divider Line
            const tableBottom = tableTop + 5;
            drawSeparator(tableBottom);
            let startY = tableBottom + 5;
            let overallTotal = 0;
            notaService.barangList?.forEach((barang, index) => {
                doc.setFont('helvetica', 'bold');
                doc.text(`${barang.NAMA}`, 10, startY);
                startY += 5;
                barang.services.forEach((service) => {
                    const name = service.NAMA;
                    const qty = service.QTY || 1;
                    const price = service.HARGA.toLocaleString();
                    const total = (service.HARGA * qty).toLocaleString();
                    overallTotal += service.HARGA * qty;
                    // Print service row
                    doc.setFont('helvetica', 'normal');
                    doc.text(`${name}`, 10, startY);
                    startY += 5;
                    doc.text(`${qty}`, 10, startY);
                    doc.text(`${price}`, 40, startY, { align: 'right' });
                    doc.text(`${total}`, 70, startY, { align: 'right' });
                    startY += 5;
                });
                // Print subtotal for the barang
                const subtotal = barang.services.reduce((acc, service) => acc + service.HARGA * (service.QTY || 1), 0);
                doc.setFont('helvetica', 'bold');
                doc.text('', 10, startY); // Empty cell
                doc.text('Subtotal', 40, startY, { align: 'right' });
                doc.text(subtotal.toLocaleString(), 70, startY, { align: 'right' });
                startY += 2;
                drawSeparator(startY);
                startY += 5;
            });
            // Print Tax and Total
            const taxRate = 0.11;
            const taxAmount = overallTotal * taxRate;
            const totalWithTax = overallTotal + taxAmount;
            doc.setFont('helvetica', 'normal');
            doc.text('', 10, startY); // Empty cell
            doc.text('Subtotal', 40, startY, { align: 'right' });
            doc.text(overallTotal.toLocaleString(), 70, startY, { align: 'right' });
            startY += 5;
            doc.text('', 10, startY); // Empty cell
            doc.text('Tax (11%)', 40, startY, { align: 'right' });
            doc.text(taxAmount.toLocaleString(), 70, startY, { align: 'right' });
            startY += 5;
            doc.setFont('helvetica', 'bold');
            doc.text('', 10, startY); // Empty cell
            doc.text('Total', 40, startY, { align: 'right' });
            doc.text(totalWithTax.toLocaleString(), 70, startY, { align: 'right' });
            const pdfData = doc.output('datauristring');
            setPdfDataUrlThermal(pdfData);
        }
    };
    return (
        <Dialog visible={visible} style={{ width: '80vw' }} onHide={onClose} header="Invoice Preview">
            <TabView>
                <TabPanel header="A4 Invoice">{pdfDataUrlA4 && <iframe title="A4 Invoice" src={pdfDataUrlA4} width="100%" height="600px" />}</TabPanel>
                <TabPanel header="Thermal Invoice">{pdfDataUrlThermal && <iframe title="Thermal Invoice" src={pdfDataUrlThermal} width="100%" height="600px" />}</TabPanel>
            </TabView>
        </Dialog>
    );
};
export default PembayaranInvoice;
