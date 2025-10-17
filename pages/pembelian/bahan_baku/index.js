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
 * Created on Tue Apr 30 2024 - 09:27:14
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../utilities/servertool';
import React, { useEffect, useRef, useState } from 'react';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { startOfMonth } from 'date-fns';
import { convertToISODate, formatAndSetDate, formatDate, formatDatePdf, formatDateTable, getEmail, getUserName } from '../../../component/GeneralFunction/GeneralFunction';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Column } from 'jspdf-autotable';
import { useRouter } from 'next/router';
import { Panel } from 'primereact/panel';
import postData from '../../../lib/Axios';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import PDFViewer from '../../../component/PDFViewer';
import { Footer, HeaderLaporan, addPageInfo } from '../../../component/exportPDF/exportPDF';
import jsPDF from 'jspdf';
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

export default function TransaksiBahanBaku() {
    const apiEndPointGet = '/api/mutasi-bahan-baku/data';
    const apiEndPointGetDataEditPenerimaan = '/api/penerimaan-bahan-baku/get-data-edit';
    const apiEndPointGetDataEditPengeluaran = '/api/pengeluaran-bahan-baku/get-data-edit';
    const apiEndPointDeletePenerimaan = '/api/penerimaan-bahan-baku/delete';
    const apiEndPointDeletePengeluaran = '/api/pengeluaran-bahan-baku/delete';

    const toast = useRef(null);
    const router = useRouter();
    const [mutasiGudang, setMutasiGudang] = useState([]);
    const [statusMutasi, setStatusMutasi] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [jenisMutasiGudangDialog, setJenisMutasiGudangDialog] = useState(false);
    const [mutasiGudangTabel, setMutasiGudangTabel] = useState([]);
    const [mutasiGudangTabelFilt, setMutasiGudangTabelFilt] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [defaultOption, setDropdownValue] = useState(null);
    const [jenisMutasiOption, setJenisMutasiOption] = useState('');
    const [isJenisMutasi, setIsJenisMutasi] = useState(false); // false masuk ke kirim, kalau true masuk ke terima
    const [deleteMutasiStockDialog, setDeleteMutasiStockDialog] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [adjustDialog, setAdjustDialog] = useState(false);
    const fileName = `laporan-pembelian-bahan-baku-${new Date().toISOString().slice(0, 10)}`;
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    const [search, setSearch] = useState('');
    // PDF OLD
    const [today, setToday] = useState(new Date());
    const [namaToko, setNamaToko] = useState(null);
    const [alamatToko, setAlamatToko] = useState(null);
    const [teleponToko, setTeleponToko] = useState(null);
    const [kotaToko, setKotaToko] = useState(null);
    const [marginTop, setMarginTop] = useState(10); // JSPDF
    const [marginLeft, setMarginLeft] = useState(10); // JSPDF
    const [marginRight, setMarginRight] = useState(10); // JSPDF
    const [marginBottom, setMarginBottom] = useState(10); // JSPDF
    const [tableWidth, setTableWidth] = useState(800); // JSPDF
    const paperSizes = [
        { name: 'A4', value: 'A4' },
        { name: 'Letter', value: 'Letter' },
        { name: 'Legal', value: 'Legal' }
    ]; // JSPDF
    const orientationOptions = [
        { label: 'Potret', value: 'portrait' },
        { label: 'Lanskap', value: 'landscape' }
    ]; // JSPDF
    const handlePaperSizeChange = (event) => {
        setSelectedPaperSize(event.target.value);
    }; // JSPDF
    const handleOrientationChange = (event) => {
        setOrientation(event.target.value);
    }; // JSPDF
    // JSPDF
    // PDF OLD
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const jenisMutasiValues = [
        { label: 'Semua', value: 'Semua' },
        { label: 'Pengeluaran', value: 'Pengeluaran' },
        { label: 'Penerimaan', value: 'Penerimaan' }
    ];

    const dropdownValues = [{ name: 'Faktur', label: 'Faktur' }];

    const onPage = (event) => {
        setlazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };

    useEffect(() => {
        setJenisMutasiOption('Semua');
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = async () => {
        try {
            setLoading(true);
            let requestBody = { ...lazyState };
            if (startDate && endDate) {
                requestBody.TglAwal = convertToISODate(startDate);
                requestBody.TglAkhir = convertToISODate(endDate);
                requestBody.JenisMutasi = jenisMutasiOption;
            }
            if (jenisMutasiOption === 'Penerimaan') {
                setIsJenisMutasi(true);
            } else {
                setIsJenisMutasi(false);
            }
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setMutasiGudangTabel(json.data);
            setTotalRecords(json.total_data);
        } catch (error) {
            // Tangani error dengan sesuai, misalnya tampilkan pesan kesalahan
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };

    // Yang Handle Inputan
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _mutasiStock = { ...mutasiGudang };
        _mutasiStock[`${name}`] = val;
        setMutasiGudang(_mutasiStock);
        if (name === 'jenisMutasi') {
            setJenisMutasiOption(val);
        }
    };

    // Open Form
    const openNew = () => {
        setMutasiGudang([]);
        setSubmitted(false);
        setJenisMutasiGudangDialog(true);
    };

    const handleKirimStock = () => {
        setMutasiGudang([]);
        setSubmitted(false);
        router.push('/pembelian/bahan_baku/form?jenis=penerimaan&status=create');
    };

    const handleTerimaStock = () => {
        setMutasiGudang([]);
        setSubmitted(false);
        router.push('/pembelian/bahan_baku/form?jenis=pengeluaran&status=create');
    };

    // Yang Handle Edit
    const editMutasi = async (rowData) => {
        const { Faktur } = rowData;
        try {
            let endPoint;
            if (Faktur.startsWith('PN')) {
                endPoint = apiEndPointGetDataEditPenerimaan;
            } else if (Faktur.startsWith('PM')) {
                endPoint = apiEndPointGetDataEditPengeluaran;
            }
            let requestBody = {
                Faktur: Faktur
            };
            const vaData = await postData(endPoint, requestBody);
            const json = vaData.data;
            localStorage.setItem('Faktur', Faktur);
            if (Faktur.startsWith('PN')) {
                router.push('/pembelian/bahan_baku/form?jenis=penerimaan&status=update');
            } else {
                router.push('/pembelian/bahan_baku/form?jenis=pengeluaran&status=update');
            }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const deleteMutasiGudang = async () => {
        try {
            let requestBody = {
                Faktur: selectedRowData.Faktur
            };

            // Menentukan endpoint berdasarkan pola faktur
            let endPoint;
            if (requestBody.Faktur.startsWith('PN')) {
                endPoint = apiEndPointDeletePenerimaan;
            } else if (requestBody.Faktur.startsWith('PM')) {
                endPoint = apiEndPointDeletePengeluaran;
            }

            // Mengirim permintaan penghapusan
            const vaData = await postData(endPoint, requestBody);
            let data = vaData.data;
            toast.current.show({ severity: 'success', summary: 'Success Message', detail: 'Berhasil Menghapus Data', life: 3000 });
            loadLazyData();
            setDeleteMutasiStockDialog(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan saat menghapus!', life: 3000 });
            setDeleteMutasiStockDialog(false);
        }
    };

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

    useEffect(() => {
        setMutasiGudangTabelFilt(mutasiGudangTabel);
    }, [mutasiGudangTabel, lazyState]);

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = mutasiGudangTabel.filter((d) => (x ? x.test(d.Faktur) || x.test(d.KetGudangKirim) || x.test(d.KetGudangTerima) || x.test(d.FullName) : []));
            setSearch(searchVal);
        }

        setMutasiGudangTabelFilt(filtered);
    };

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <Dropdown id="JenisMutasi" value={jenisMutasiOption} onChange={(e) => onInputChange(e, 'jenisMutasi')} options={jenisMutasiValues} optionLabel="label" optionValue="value" placeholder="Jenis Mutasi" />
                <div className="p-inputgroup">
                    <Calendar name="startDate" value={startDate} onInput={handleStartDateChange} onChange={handleStartDate} placeholder="Start Date" dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Calendar name="endDate" value={endDate} onInput={handleEndDateChange} onChange={handleEndDate} placeholder="End Date" dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} />
                </div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );

    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.name != null) {
            _lazyState['filters'][defaultOption.name] = value;
        }
        onPage(_lazyState);
    };

    // Yang Handle Toolbar
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2" style={{ display: 'flex', alignItems: 'center' }}>
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew}></Button>
                </div>
            </React.Fragment>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editMutasi(rowData)}></Button>
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteMutasi(rowData)}></Button>
            </div>
        );
    };

    const confirmDeleteMutasi = (rowData) => {
        setSelectedRowData(rowData);
        setDeleteMutasiStockDialog(true);
    };

    const deleteMutasiStockDialogFooter = (rowData) => (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={() => setDeleteMutasiStockDialog(false)} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteMutasiGudang} />
        </>
    );

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (mutasiGudangTabel.length == 0 || !mutasiGudangTabel) {
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
            const mutasiGudangPDF = mutasiGudangTabelFilt ? JSON.parse(JSON.stringify(mutasiGudangTabelFilt)) : [];
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

            if (!mutasiGudangPDF || mutasiGudangPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Mutasi Gudang';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + 's.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = mutasiGudangPDF.map((item) => [item.Faktur, formatDatePdf(item.Tgl), parseInt(item.Total).toLocaleString(), item.Username]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['FAKTUR', 'TANGGAL', 'TOTAL', 'USERNAME']],
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
                    2: { halign: 'right' }
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
        exportToXLSX(mutasiGudangTabel, 'laporan-mutasi-antar-gudang.xlsx');
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
                        <h4>Menu Mutasi Bahan Baku</h4>
                        <hr />
                        <Toast ref={toast}></Toast>
                        <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
                        <DataTable
                            value={mutasiGudangTabelFilt}
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
                            <Column field="Faktur" header="FAKTUR"></Column>
                            <Column field="Tgl" header="TANGGAL" body={(rowData) => (rowData.Tgl ? formatDateTable(rowData.Tgl) : '-')}></Column>
                            <Column field="Total" body={(rowData) => {
                                const value = rowData.Total ? parseInt(rowData.Total).toLocaleString() : "";
                                return value;
                            }} header="TOTAL"></Column>
                            <Column field="Username" header="USERNAME"></Column>
                            <Column header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>
                        <Toolbar className="mb-4" left={preview}></Toolbar>
                    </div>
                </div>
                {/* Dialog Jenis Mutasi Gudang */}
                <Dialog visible={jenisMutasiGudangDialog} header="Pilih Jenis Mutasi Bahan Baku" modal onHide={() => setJenisMutasiGudangDialog(false)}>
                    <div className="flex align-items-center justify-content-center">
                        <Button label="Penerimaan Bahan Baku" icon="pi pi-external-link" className="p-button-success ml-2 mr-2" onClick={handleKirimStock}></Button>
                        <Button label="Pengeluaran Bahan Baku" icon="pi pi-box" className="p-button-success ml-2 mr-2" onClick={handleTerimaStock}></Button>
                    </div>
                </Dialog>
                {/* Dialog Delete Mutasi Stock */}
                <Dialog visible={deleteMutasiStockDialog} header="Confirm" modal footer={deleteMutasiStockDialogFooter} onHide={() => setDeleteMutasiStockDialog(false)}>
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        {mutasiGudang && <span>Yakin ingin Menghapus Data ini?</span>}
                    </div>
                </Dialog>
                <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
                <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                    <div className="p-dialog-content">
                        <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                    </div>
                </Dialog>
            </div>
        </BlockUI>
    );
}
