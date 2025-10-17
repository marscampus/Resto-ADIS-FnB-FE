'use client';

import { startOfMonth } from 'date-fns';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { convertToISODate, formatCurrency, formatDateTable } from '../../../component/GeneralFunction/GeneralFunction';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import PDFViewer from '../../../component/PDFViewer';
import { getSessionServerSide } from '../../../utilities/servertool';
import postData from '../../../lib/Axios';
import PembayaranInvoice from '../../../component/plugin/services/pembayaranInvoice';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    // const userPlugin = await checkUserHadPlugins(sessionData.user.email, 'services');

    // console.log(sessionData.user.email);
    // if (userPlugin?.redirect) {
    //     return userPlugin;
    // }
    return {
        props: {}
    };
}

const PembayaranPage = () => {
    const apiEndPointGetFaktur = '/api/get_faktur';
    const [pembayarans, setPembayarans] = useState([]);
    const [pembayaransFilt, setPembayaransFilt] = useState([]);
    const [pembayaranDialog, setPembayaranDialog] = useState(false);
    const [deletePembayaranDialog, setDeletePembayaranDialog] = useState(false);
    const [deletePembayaransDialog, setDeletePembayaransDialog] = useState(false);
    const [search, setSearch] = useState('');
    const [pembayaran, setPembayaran] = useState({
        FAKTUR: '',
        KODE: '',
        PEMILIK: '',
        TGLBAYAR: new Date().toISOString().split('T')[0],
        ESTIMASISELESAI: new Date().toISOString().split('T')[0],
        DP: 0,
        NOMINALBAYAR: 0,
        ESTIMASIHARGA: 0,
        HARGA: 0,
        PPN: 0
    });
    const apiEndPointGetData = '/api/pembayaran/nota/data';
    const apiEndPointGetDataFromFaktur = '/api/pembayaran/nota/get/data';
    const apiEndPointDeleteKode = '/api/pembayaran/nota/delete';
    const apiEndPointDeleteFaktur = '/api/pembayaran/delete';
    const apiEndPointGetDataFaktur = '/api/pembayaran/get/data';
    const apiEndPointGetDataFromKode = '/api/pembayaran/nota/get/data';

    const [faktur, setFaktur] = useState(null);
    const [selectedPembayarans, setSelectedPembayarans] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [notaServiceOptions, setNotaServiceOptions] = useState([]);
    const [selectedNotaService, setSelectedNotaService] = useState(null);
    const [barangList, setBarangList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);
    const toast = useRef(null);
    const dt = useRef(null);
    const [showInvoice, setShowInvoice] = useState(false);
    const [invoiceNotaService, setInvoiceNotaService] = useState(null);
    const [jenisPembayaranDialog, setJenisPembayaranDialog] = useState(false);
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const router = useRouter();
    const [totalRecords, setTotalRecords] = useState(0);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [adjustDialog, setAdjustDialog] = useState(false);
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
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

    useEffect(() => {
        loadPembayarans();
    }, []);

    useEffect(() => {
        setPembayaransFilt(pembayarans);
    }, [pembayarans, lazyState]);

    const onPage = (event) => {
        setlazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };

    const refresh = () => {
        loadPembayarans();
    };

    const loadPembayarans = async () => {
        setLoading(true);
        try {
            let requestBody = { ...lazyState };
            if (startDate && endDate) {
                requestBody.START_DATE = convertToISODate(startDate);
                requestBody.END_DATE = convertToISODate(endDate);
            }
            const data = await postData(apiEndPointGetData, requestBody);
            setPembayarans(data.data.data);
        } catch (error) {
            console.error('Error loading pembayarans:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan saat memuat data pembayaran', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const openNew1 = async () => {
        try {
            const { FAKTUR } = await PembayaranAPI.getNewIdentifiers();
            setPembayaran({
                FAKTUR,
                KODE: '',
                PEMILIK: '',
                TGLBAYAR: new Date().toISOString().split('T')[0],
                ESTIMASISELESAI: new Date().toISOString().split('T')[0],
                DP: 0,
                NOMINALBAYAR: 0,
                ESTIMASIHARGA: 0,
                HARGA: 0
            });
            setSelectedNotaService(null);
            setBarangList([]);
            setSubmitted(false);
            setPembayaranDialog(true);
        } catch (error) {
            console.error('Error getting new identifiers:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan saat membuat data pembayaran baru', life: 3000 });
        }
    };

    const openNew = async () => {
        try {
            let requestBody = {
                Kode: 'PSV',
                Len: 6
            };
            const response = await postData(apiEndPointGetFaktur, requestBody);
            const json = response.data;
            setFaktur(json);
            setPembayaran((prevPembayaran) => ({
                ...prevPembayaran,
                KODE: json
            }));
        } catch (error) { }
        setPembayaran([]);
        setSubmitted(false);
        setJenisPembayaranDialog(true);
    };

    const handleDenganNota = () => {
        setSubmitted(false);
        setSelectedNotaService(null);
        setBarangList([]);
        setSubmitted(false);
        router.push('/plugin/services/pembayaran/form');
    };

    const handleTanpaNota = () => {
        setSubmitted(false);
        setSelectedNotaService(null);
        setBarangList([]);
        setSubmitted(false);
        router.push('/plugin/services/pembayaran/tanpa-nota/form');
    };

    const hideDialog = () => {
        setSubmitted(false);
        setPembayaranDialog(false);
    };
    const hideDeletePembayaranDialog = () => {
        setDeletePembayaranDialog(false);
    };
    const hideDeletePembayaransDialog = () => {
        setDeletePembayaransDialog(false);
    };

    const editPembayaran1 = async (pembayaran) => {
        setPembayaran({ ...pembayaran });
        setPembayaranDialog(true);
        const notaServiceDetails = await PembayaranAPI.getOne(pembayaran.KODE);
        setBarangList(notaServiceDetails.barangList || []);
    };

    const editPembayaran2 = async (rowData) => {
        try {
            let requestBody = {
                Faktur: rowData.FAKTUR
            };
            const vaData = await postData(apiEndPointGetDataFromFaktur, requestBody);
            const json = vaData.data;
            if (json.code === '500') {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Terjadi Kesalahan Dalam Mengambil Data!', life: 3000 });
                return;
            } else {
                localStorage.setItem('FAKTUR', rowData.FAKTUR); // Simpan FAKTUR di localStorage
                router.push('/services/pembayaran/form?status=update');
            }
        } catch (error) {
            console.log(error);
        }
    };

    const editPembayaran = async (rowData) => {
        let Faktur = rowData.FAKTUR;
        try {
            let endPoint;
            if (Faktur.startsWith('PSV')) {
                endPoint = apiEndPointGetDataFromKode;
            } else if (Faktur.startsWith('INV')) {
                endPoint = apiEndPointGetDataFaktur;
            }
            let requestBody = {
                Faktur: Faktur
            };
            const vaData = await postData(endPoint, requestBody);
            const json = vaData.data;
            if (json.code === '500') {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Terjadi Kesalahan Dalam Mengambil Data!', life: 3000 });
                return;
            } else {
                localStorage.setItem('FAKTUR', rowData.FAKTUR);
                if (Faktur.startsWith('PSV')) {
                    router.push('/plugin/services/pembayaran/form?status=update');
                } else {
                    router.push('/plugin/services/pembayaran/tanpa-nota/form?status=update');
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    const confirmDeletePembayaran = (pembayaran) => {
        setPembayaran(pembayaran);
        setDeletePembayaranDialog(true);
    };

    const deletePembayaran = async () => {
        try {
            let requestBody = {
                Faktur: pembayaran.FAKTUR
            };
            const vaData = await postData(apiEndPointDeleteKode, requestBody);
            let data = vaData.data;

            if (data.code === '200') {
                toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil menghapus Nota Service', life: 3000 });
                loadPembayarans();
                setDeletePembayaranDialog(false);
            }
        } catch (error) {
            console.error('Error deleting nota service:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan saat menghapus Nota Service', life: 3000 });
        }
    };

    const exportCSV = () => {
        dt.current?.exportCSV();
    };
    const confirmDeleteSelected = () => {
        setDeletePembayaransDialog(true);
    };
    const deleteSelectedPembayarans = async () => {
        try {
            await PembayaranAPI.bulkDelete(selectedPembayarans.map((p) => p.FAKTUR));
            loadPembayarans();
            setDeletePembayaransDialog(false);
            setSelectedPembayarans([]);
            toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil menghapus pembayaran yang dipilih', life: 3000 });
        } catch (error) {
            console.error('Error deleting pembayarans:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan saat menghapus pembayaran yang dipilih', life: 3000 });
        }
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Tambah" icon="pi pi-plus" severity="success" onClick={openNew} className="mr-2" />
            </React.Fragment>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Ekspor" icon="pi pi-u</DataTable>pload" severity="help" onClick={exportCSV} />
            </React.Fragment>
        );
    };

    const handleShowInvoice = (rowData) => {
        setShowDialog(true); // open dialog
    };

    const handleCloseDialog = () => {
        setShowDialog(false); // close dialog
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded severity="success" className="mr-2" onClick={() => editPembayaran(rowData)} />
                <Button icon="pi pi-trash" rounded severity="warning" onClick={() => confirmDeletePembayaran(rowData)} />
            </React.Fragment>
        );
    };

    const handleStartDateChange = (e) => {
        setStartDate(e.value);
    };
    const handleEndDateChange = (e) => {
        setEndDate(e.value);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar name="startDate" value={startDate} onChange={handleStartDateChange} placeholder="Start Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Calendar name="endDate" value={endDate} onChange={handleEndDateChange} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={refresh} />
                </div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText placeholder="Search" value={search} onChange={(e) => filterPlugins('search', e.target.value)} className="w-full" />
                </span>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = pembayarans.filter((d) => (x ? x.test(d.FAKTUR) || x.test(d.KODE) || x.test(d.PEMILIK) || x.test(d.TGLBAYAR) || x.test(d.HARGA) || x.test(d.SISA) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = pembayarans;
            } else {
                filtered = pembayarans.filter((d) => (x ? x.test(d.FAKTUR) : []));
            }
        }
        console.log(filtered);

        setPembayaransFilt(filtered);
    };

    const deletePembayaranDialogFooter = (
        <React.Fragment>
            <Button label="Batal" icon="pi pi-times" text onClick={hideDeletePembayaranDialog} />
            <Button label="Ya" icon="pi pi-check" text onClick={deletePembayaran} />
        </React.Fragment>
    );
    const deletePembayaransDialogFooter = (
        <React.Fragment>
            <Button label="Batal" icon="pi pi-times" text onClick={hideDeletePembayaransDialog} />
            <Button label="Ya" icon="pi pi-check" text onClick={deleteSelectedPembayarans} />
        </React.Fragment>
    );

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (pembayarans.length == 0 || !pembayarans) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    const exportPDF = async (dataAdjust) => {
        try {
            const notaTabelPDF = pembayarans ? JSON.parse(JSON.stringify(pembayarans)) : [];
            let format = 'a4';
            if (selectedPaperSize === 'Letter') {
                format = 'letter';
            } else if (selectedPaperSize === 'Legal') {
                format = 'legal';
            }

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation,
                unit: 'mm',
                format,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            if (!notaTabelPDF || notaTabelPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Pembayaran';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + 's.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = notaTabelPDF.map((item) => [item.FAKTUR, item.KODE, formatDate(item.TGLBAYAR), item.PEMILIK, parseInt(item.HARGA).toLocaleString(), parseInt(item.SISA).toLocaleString(), item.STATUS]);
            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['FAKTUR', 'NO.SERVIS.', 'TANGGAL BAYAR', 'PEMILIK', 'HARGA', 'SISA/KEMBALIAN', 'STATUS']],
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
                    2: { align: 'center' },
                    4: { align: 'right' },
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

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setShowPreview(false);
        } catch (error) {
            console.log(error);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(pembayarans, 'laporan-pembayaran.xlsx');
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
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Pembayaran</h4>
                    <hr></hr>
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                    <DataTable
                        value={pembayaransFilt}
                        // globalFilter={globalFilter}
                        filters={lazyState.filters}
                        header={header}
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
                        <Column field="FAKTUR" header="FAKTUR" body={(rowData) => <span>{rowData.FAKTUR}</span>}></Column>
                        <Column field="KODE" header="NO. SERVIS" body={(rowData) => <span>{rowData.KODE}</span>}></Column>
                        <Column field="PEMILIK" header="PEMILIK" body={(rowData) => <span>{rowData.PEMILIK}</span>}></Column>
                        <Column field="TGLBAYAR" header="TANGGAL BAYAR" body={(rowData) => <span>{formatDateTable(rowData.TGLBAYAR)}</span>}></Column>
                        <Column field="HARGA" header="TOTAL HARGA" body={(rowData) => <span>{formatCurrency(rowData.HARGA)}</span>}></Column>
                        <Column field="SISA" header="SISA/KEMBALIAN" body={(rowData) => <span>{formatCurrency(rowData.SISA)}</span>}></Column>
                        <Column field="STATUS" header="STATUS"></Column>
                        <Column header="ACTION" body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>
                    <Toolbar className="mb-4" left={preview}></Toolbar>
                    <Dialog visible={deletePembayaranDialog} style={{ width: '450px' }} header="Confirm" modal footer={deletePembayaranDialogFooter} onHide={hideDeletePembayaranDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {pembayaran && <span>Apa kamu yakin ingin menghapus pembayaran ini?</span>}
                        </div>
                    </Dialog>

                    <Dialog visible={deletePembayaransDialog} style={{ width: '450px' }} header="Confirm" modal footer={deletePembayaransDialogFooter} onHide={hideDeletePembayaransDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {pembayaran && <span>Apa kamu yakin ingin menghapus pembayaran yang dipilih?</span>}
                        </div>
                    </Dialog>

                    {/* Dialog Jenis Pembayaran */}
                    <Dialog visible={jenisPembayaranDialog} header="Pilih Jenis Pembayaran" modal onHide={() => setJenisPembayaranDialog(false)}>
                        <div className="flex align-items-center justify-content-center">
                            <Button label="Dengan Nota" icon="pi pi-external-link" className="p-button-success ml-2 mr-2" onClick={handleDenganNota} />
                            <Button label="Tanpa Nota" icon="pi pi-box" className="p-button-success ml-2 mr-2" onClick={handleTanpaNota} />
                        </div>
                    </Dialog>

                    <PembayaranInvoice notaService={invoiceNotaService} visible={showInvoice} onClose={() => setShowInvoice(false)} />
                </div>
            </div>
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
        </div>
    );
};
export default PembayaranPage;
