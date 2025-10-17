/*
 * Copyright (C) Godong
 *http://www.marstech.co.id
 *Email. info@marstech.co.id
 *Telp. 0811-3636-09
 *Office        : Jl. Margatama Asri IV, Kanigoro, Kec. Kartoharjo, Kota Madiun, Jawa Timur 63118
 *Branch Office : Perum Griya Gadang Sejahtera Kav. 14 Gadang - Sukun - Kota Malang - Jawa Timur
 *
 *Godong
 *Adalah merek dagang dari PT. Marstech Global
 *
 *License Agreement
 *Software komputer atau perangkat lunak komputer ini telah diakui sebagai salah satu aset perusahaan yang bernilai.
 *Di Indonesia secara khusus,
 *software telah dianggap seperti benda-benda berwujud lainnya yang memiliki kekuatan hukum.
 *Oleh karena itu pemilik software berhak untuk memberi ijin atau tidak memberi ijin orang lain untuk menggunakan softwarenya.
 *Dalam hal ini ada aturan hukum yang berlaku di Indonesia yang secara khusus melindungi para programmer dari pembajakan software yang mereka buat,
 *yaitu diatur dalam hukum hak kekayaan intelektual (HAKI).
 *
 *********************************************************************************************************
 *Pasal 72 ayat 3 UU Hak Cipta berbunyi,
 *' Barangsiapa dengan sengaja dan tanpa hak memperbanyak penggunaan untuk kepentingan komersial '
 *' suatu program komputer dipidana dengan pidana penjara paling lama 5 (lima) tahun dan/atau '
 *' denda paling banyak Rp. 500.000.000,00 (lima ratus juta rupiah) '
 *********************************************************************************************************
 *
 *Proprietary Software
 *Adalah software berpemilik, sehingga seseorang harus meminta izin serta dilarang untuk mengedarkan,
 *menggunakan atau memodifikasi software tersebut.
 *
 *Commercial software
 *Adalah software yang dibuat dan dikembangkan oleh perusahaan dengan konsep bisnis,
 *dibutuhkan proses pembelian atau sewa untuk bisa menggunakan software tersebut.
 *Detail Licensi yang dianut di software https://en.wikipedia.org/wiki/Proprietary_software
 *EULA https://en.wikipedia.org/wiki/End-user_license_agreement
 *
 *Lisensi Perangkat Lunak https://id.wikipedia.org/wiki/Lisensi_perangkat_lunak
 *EULA https://id.wikipedia.org/wiki/EULA
 *
 * Created on Thu Jun 20 2024 - 02:23:41
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../../utilities/servertool';
import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { startOfMonth } from 'date-fns';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { convertToISODate, formatAndSetDate, formatDate, formatDateTable, getEmail, getUserName } from '../../../../component/GeneralFunction/GeneralFunction';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import postData from '../../../../lib/Axios';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import { Footer, Header, addPageInfo } from '../../../../component/exportPDF/exportPDF';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import { Dialog } from 'primereact/dialog';
import PDFViewer from '../../../../component/PDFViewer';
import jsPDF from 'jspdf';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function LaporanSisaPembayaranPiutang() {
    const apiEndPointGet = '/api/laporan/penjualan/sisa-piutang';
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [sisaTabel, setSisaTabel] = useState(null);
    const [totalRecords, setTotalRecords] = useState(0);
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [defaultOption, setDropdownValue] = useState(null);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [totalPiutang, setTotalPiutang] = useState(0);
    const [totalSisa, setTotalSisa] = useState(0);
    const fileName = `laporan-sisa-piutang-${new Date().toISOString().slice(0, 10)}`;
    // JSPDF
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [marginTop, setMarginTop] = useState(10);
    const [marginLeft, setMarginLeft] = useState(10);
    const [marginRight, setMarginRight] = useState(10);
    const [marginBottom, setMarginBottom] = useState(10);
    const [tableWidth, setTableWidth] = useState(800);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    const paperSizes = [
        { name: 'A4', value: 'A4' },
        { name: 'Letter', value: 'Letter' },
        { name: 'Legal', value: 'Legal' }
    ];
    const orientationOptions = [
        { label: 'Potret', value: 'portrait' },
        { label: 'Lanskap', value: 'landscape' }
    ];
    const handlePaperSizeChange = (event) => {
        setSelectedPaperSize(event.target.value);
    };
    const handleOrientationChange = (event) => {
        setOrientation(event.target.value);
    };
    function handleShowPreview() {
        setShowPreview(true);
    }
    const dropdownValues = [
        { name: 'Member', label: 'kp.Member' },
        { name: 'Nama Member', label: 'dt.Nama' }
    ];
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const onPage = (event) => {
        setlazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = async () => {
        try {
            setLoading(true);
            let requestBody = { ...lazyState };
            if (startDate && endDate) {
                requestBody.TglAwal = convertToISODate(startDate);
                requestBody.TglAkhir = convertToISODate(endDate);
            }
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setSisaTabel(json.data);
            setTotalRecords(json.total_data);
            setTotalPiutang(json.total.GrandTotalPiutang);
            setTotalSisa(json.total.GrandSisaPiutang);
        } catch (error) {
            // Tangani error dengan sesuai, misalnya tampilkan pesan kesalahan
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    //  Yang Handle Inputan Tanggal
    const handleStartDate = (e) => {
        setStartDate(e.value);
    };

    const handleStartDateChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setStartDate);
    };

    const handleEndDate = (e) => {
        setEndDate(e.value);
    };

    const handleEndDateChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setEndDate);
    };

    // Yang Handle Pencarian
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar name="startDate" value={startDate} onInput={handleStartDateChange} onChange={handleStartDate} placeholder="Start Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Calendar name="endDate" value={endDate} onInput={handleEndDateChange} onChange={handleEndDate} F placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} />
                </div>
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih Kolom" />
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => onSearch(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );

    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.label != null) {
            _lazyState['filters'][defaultOption.label] = value;
        }
        onPage(_lazyState);
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (sisaTabel.length == 0 || !sisaTabel) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    // PDF
    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    const exportPDF = async () => {
        try {
            setLoadingPreview(true);
            const sisaPiutangPDF = sisaTabel ? JSON.parse(JSON.stringify(sisaTabel)) : [];

            let format = 'a4';
            if (selectedPaperSize === 'Letter') {
                format = 'letter';
            } else if (selectedPaperSize === 'Legal') {
                format = 'legal';
            }

            const marginLeftInMm = parseFloat(marginLeft);
            const marginTopInMm = parseFloat(marginTop);
            const marginRightInMm = parseFloat(marginRight);

            const doc = new jsPDF({
                orientation,
                unit: 'mm',
                format,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            if (!sisaPiutangPDF || sisaPiutangPDF.lenght === 0) {
                // If the table is empty, add a message to the PDF
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });

                // You can also add any other relevant information or styling for an empty table
            }

            const userName = await getUserName(await getEmail());
            const judulLaporan = 'Laporan Pembayaran Piutang';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + ' s.d ' + formatDate(endDate);
            await Header({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = sisaPiutangPDF.map((item) => [item.Member, item.NamaMember, formatDateTable(item.JthTmp), parseInt(item.TotalPiutang).toLocaleString(), parseInt(item.SisaPiutang).toLocaleString()]);

            tableData.push(['TOTAL ', '', '', parseInt(totalPiutang).toLocaleString(), parseInt(totalSisa).toLocaleString()]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['MEMBER', 'NAMA MEMBER', 'JTH TMP', 'TOTAL PIUTANG', 'SISA PIUTANG']],
                body: tableData,
                theme: 'plain',
                margin: {
                    top: marginTopInMm,
                    left: marginLeftInMm,
                    right: marginRightInMm
                },
                styles: {
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontSize: 8
                },
                columnStyles: {
                    2: { halign: 'center' },
                    3: { halign: 'right' },
                    4: { halign: 'right' }
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                didDrawPage: (data) => {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });
            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setShowPreview(false);
            setLoadingExportPDF(false);
            setLoadingPreview(false);
        } catch (error) {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(sisaTabel, 'laporan-sisa-piutang.xlsx');
    };

    const preview = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };

    return (
        <div className="full-page">
            <div className="card">
                <h4>Laporan Sisa Pembayaran Piutang</h4>
                <hr></hr>
                <Toast ref={toast}></Toast>
                <DataTable
                    size="small"
                    value={sisaTabel}
                    lazy
                    paginator
                    rows={rows}
                    className="datatable-responsive"
                    first={first}
                    totalRecords={totalRecords}
                    onPage={onPage}
                    loading={loading}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                    header={headerSearch}
                    filters={lazyState.filters}
                    emptyMessage="Data Kosong"
                >
                    <Column field="Member" header="MEMBER"></Column>
                    <Column field="NamaMember" header="NAMA MEMBER"></Column>
                    <Column field="JthTmp" header="JTH TEMPO" body={(rowData) => formatDate(rowData.JthTmp)} footer={'TOTAL'}></Column>
                    <Column field="TotalPiutang" header="TOTAL PIUTANG" body={(rowData) => (rowData.TotalPiutang ? `${rowData.TotalPiutang.toLocaleString()}` : '0')} footer={parseFloat(totalPiutang).toLocaleString()}></Column>
                    <Column field="SisaPiutang" header="SISA PIUTANG" body={(rowData) => (rowData.SisaPiutang ? `${rowData.SisaPiutang.toLocaleString()}` : '0')} footer={parseFloat(totalSisa).toLocaleString()}></Column>
                </DataTable>
                <Toolbar className="mb-4" left={preview}></Toolbar>
            </div>
            {/* Dialog JSPDF */}
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                </div>
            </Dialog>
        </div>
    );
}
