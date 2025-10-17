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
 * Created on Wed Aug 07 2024 - 09:42:16
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */
import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../utilities/servertool';
import React, { useEffect, useRef, useState } from 'react';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { useRouter } from 'next/router';
import { DataTable } from 'primereact/datatable';
import { Calendar } from 'primereact/calendar';
import { startOfMonth } from 'date-fns';
import { Column } from 'primereact/column';
import { convertToISODate, formatAndSetDate, formatDateTable, getEmail, getUserName } from '../../../component/GeneralFunction/GeneralFunction';
import { InputText } from 'primereact/inputtext';
import postData from '../../../lib/Axios';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import PDFViewer from '../../../component/PDFViewer';
import { Dialog } from 'primereact/dialog';
import jsPDF from 'jspdf';
import { addPageInfo, Footer, HeaderLaporan } from '../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
import { BlockUI } from 'primereact/blockui';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function JurnalLainLain() {
    const apiEndPointGet = '/api/jurnal-lain/data';
    const apiEndPointDelete = '/api/jurnal-lain/delete';
    const toast = useRef(null);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [jurnalLain, setJurnalLain] = useState([]);
    const [jurnalLainTabel, setJurnalLainTabel] = useState([]);
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [totalRecords, setTotalRecords] = useState(0);
    const [defaultOption, setDropdownValue] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [jurnalLainTabelFilt, setJurnalLainTabelFilt] = useState([]);
    const [search, setSearch] = useState('');
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [deleteJurnalDialog, setDeleteJurnalDialog] = useState(false);
    const fileName = `jurnal-lain-lain-${new Date().toISOString().slice(0, 10)}`;
    const [lazyState, setLazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    useEffect(() => {
        setJurnalLainTabelFilt(jurnalLainTabel);
    }, [jurnalLainTabel, lazyState]);

    const onPage = (event) => {
        setLazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = jurnalLainTabel.filter((d) => (x ? x.test(d.Faktur) || x.test(d.Tgl) || x.test(d.Rekening) || x.test(d.NamaPerkiraan) || x.test(d.Debet) || x.test(d.Kredit) : []));
            setSearch(searchVal);
        }

        setJurnalLainTabelFilt(filtered);
    };

    const loadLazyData = async () => {
        try {
            setLoading(true);
            let requestBody = {
                ...lazyState
            };
            if (startDate && endDate) {
                requestBody.TglAwal = convertToISODate(startDate);
                requestBody.TglAkhir = convertToISODate(endDate);
            }
            const vaData = await postData(apiEndPointGet, requestBody);
            const json = vaData.data;
            setTotalRecords(json.total_data);
            let fakturTracker = {};
            const updatedJson = json.data.map((item, index) => {
                const faktur = item.Faktur;
                if (fakturTracker[faktur]) {
                    item.Faktur = '';
                } else {
                    fakturTracker[faktur] = true;
                }
                item.ID = index + 1; // Ensure ID field is added
                return item;
            });
            setJurnalLainTabel(updatedJson);
        } catch (error) {
            setLoading(false);
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    // Dialog Form
    const openNew = () => {
        setSubmitted(false);
        router.push('/pembukuan/jurnal-lain/form');
    };

    // Handle Date
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

    // Header
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar name="startDate" value={startDate} onInput={handleStartDateChange} onChange={handleStartDate} dateFormat="dd-mm-yy" showIcon />
                    <Calendar name="endDate" value={endDate} onInput={handleEndDateChange} onChange={handleEndDate} dateFormat="dd-mm-yy" showIcon />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} style={{ marginLeft: '5px' }} />
                </div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );

    // Delete Data
    const confirmDeleteJurnal = (rowData) => {
        setJurnalLain(rowData);
        setDeleteJurnalDialog(true);
    };

    const hideDeleteJurnalDialog = () => {
        setDeleteJurnalDialog(false);
    };

    const deleteJurnalLain = async (rowData) => {
        try {
            let requestBody = {
                Faktur: jurnalLain.Faktur
            }
            const vaData = await postData(apiEndPointDelete, requestBody);
            let json = vaData.data;
            showSuccess(json?.message);
            setDeleteJurnalDialog(false);
            loadLazyData();
        } catch (error) {
            let e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        }
    };

    const deleteJurnalDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteJurnalDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteJurnalLain} />
        </>
    );

    // Action
    const actionBodyTemplate = (rowData) => {
        return <>{rowData.Faktur && <Button icon="pi pi-trash" severity="danger" rounded onClick={() => confirmDeleteJurnal(rowData)} />}</>;
    };

    // Toolbar
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew}></Button>
                </div>
            </React.Fragment>
        );
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (jurnalLainTabel.length == 0 || !jurnalLainTabel) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    const exportPDF = async (dataAdjust) => {
        setLoadingPreview(true);
        try {
            const rekeningPDF = jurnalLainTabelFilt ? JSON.parse(JSON.stringify(jurnalLainTabelFilt)) : [];

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.paperSize,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            let paraf1 = dataAdjust?.paraf1 || '';
            let paraf2 = dataAdjust?.paraf2 || '';
            let namaPetugas1 = dataAdjust?.namaPetugas1 || '';
            let namaPetugas2 = dataAdjust?.namaPetugas2 || '';
            let jabatan1 = dataAdjust?.jabatan1 || '';
            let jabatan2 = dataAdjust?.jabatan2 || '';

            if (!rekeningPDF || rekeningPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Jurnal Lain-Lain';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = rekeningPDF.map((item) => [
                item.Faktur,
                formatDateTable(item.Tgl),
                item.Rekening + ' - ' + item.NamaPerkiraan,
                item.Keterangan,
                item.Debet ? parseInt(item.Debet).toLocaleString() : 0,
                item.Kredit ? parseInt(item.Kredit).toLocaleString() : 0,
                item.UserName
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['FAKTUR', 'TGL', 'REKENING', 'KETERANGAN', 'DEBET', 'KREDIT', 'USERNAME']],
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
                    0: { halign: 'center' },
                    1: { halign: 'center' },
                    4: { halign: 'right' },
                    5: { halign: 'right' }
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

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2 });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setShowPreview(false);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(jurnalLainTabelFilt, 'jurnal-lain-lain.xlsx');
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
        <BlockUI
            blocked={loadingPreview}
            template={
                <div className="flex align-items-center justify-content-center flex-column gap-3" style={{ height: '100%' }}>
                    <div className="pi pi-spin pi-spinner" style={{ fontSize: '6rem' }}></div>
                    <p>Loading...</p>
                </ div>
            }
        >
            <div className="grid crud-demo">
                <div className="col-12">
                    <div className="card">
                        <h4>Jurnal Lain-Lain</h4>
                        <hr></hr>
                        <Toast ref={toast}></Toast>
                        <Toolbar className="mb-4" start={leftToolbarTemplate}></Toolbar>
                        <DataTable
                            value={jurnalLainTabelFilt}
                            // globalFilter={globalFilter}
                            filters={lazyState.filters}
                            header={headerSearch}
                            first={first} // Menggunakan nilai halaman pertama dari state
                            rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                            onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                            paginator
                            paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            totalRecords={totalRecords} // Total number of records
                            size="small"
                            loading={loading}
                            emptyMessage="Data Kosong"
                            onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                        >
                            <Column field="ID" header="ID"></Column>
                            <Column field="Faktur" header="FAKTUR"></Column>
                            <Column field="Tgl" header="TANGGAL"></Column>
                            <Column field="Rekening" header="REKENING"></Column>
                            <Column field="NamaPerkiraan" header="KET. PERKIRAAN"></Column>
                            <Column field="Keterangan" header="KETERANGAN"></Column>
                            <Column
                                field="Debet"
                                body={(rowData) => {
                                    const value = rowData.Debet ? parseInt(rowData.Debet).toLocaleString() : '';
                                    return value;
                                }}
                                header="DEBET"
                            ></Column>
                            <Column
                                field="Kredit"
                                body={(rowData) => {
                                    const value = rowData.Kredit ? parseInt(rowData.Kredit).toLocaleString() : '';
                                    return value;
                                }}
                                header="KREDIT"
                            ></Column>
                            <Column field="UserName" header="USERNAME"></Column>
                            <Column header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>
                        <Toolbar className="mb-4" left={preview}></Toolbar>
                    </div>
                </div>
                <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
                <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                    <div className="p-dialog-content">
                        <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                    </div>
                </Dialog>
                <Dialog visible={deleteJurnalDialog} header="Confirm" modal footer={deleteJurnalDialogFooter} onHide={hideDeleteJurnalDialog}>
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        {jurnalLain && (
                            <span>
                                Are you sure you want to delete <strong>{jurnalLain.Faktur}</strong>
                            </span>
                        )}
                    </div>
                </Dialog>
            </div>
        </BlockUI>
    );
}
