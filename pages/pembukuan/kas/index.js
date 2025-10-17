/* eslint-disable */
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import axios from 'axios';
import { useRouter } from 'next/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { startOfMonth } from 'date-fns';
import { getSessionServerSide } from '../../../utilities/servertool';
import postData from '../../../lib/Axios';
import { convertToISODate, formatAndSetDate, formatColumnValue, formatDate, formatRibuan, getDBConfig, getEmail, getUserName, showError, showSuccess } from '../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../component/PDFViewer';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import { addPageInfo, Footer, HeaderLaporan } from '../../../component/exportPDF/exportPDF';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { useSession } from 'next-auth/react';
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
export default function kasPage() {
    const apiEndPointGet = '/api/kas/get';
    const apiEndPointDelete = '/api/kas/delete';

    let emptykas = {
        ID: null,
        Faktur: null,
        Tgl: null,
        RekeningJumlah: null,
        RekeningKredit: null,
        Jumlah: null,
        Kredit: null,
        Keterangan: null
    };

    const toast = useRef(null);

    const { data: session, status } = useSession();
    let unitUsaha = session?.unit_usaha;
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [deleteKasDialog, setDeleteKasDialog] = useState(false);
    const [kas, setKas] = useState(emptykas);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [kasTabel, setKasTabel] = useState([]);
    const [kasTabelFilt, setKasTabelFilt] = useState([]);
    const [tglAwal, setTglAwal] = useState(startOfMonth(new Date()));
    const [tglAkhir, setTglAkhir] = useState(new Date());
    const [search, setSearch] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [jenisTransaksiKasDialog, setJenisTransaksiKasDialog] = useState(false);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const fileName = `laporan-transaksi-kas-${new Date().toISOString().slice(0, 10)}`;
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    useEffect(() => {
        setKasTabelFilt(kasTabel);
    }, [kasTabel, lazyState]);

    const fetchData = async () => {
        try {
            await Promise.all([komponenPDF(), loadLazyData()]);
            setLoadingPreview(false); // Setelah selesai loading, ubah status menjadi false
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            setLoadingPreview(false); // Handle error, dan set status loading menjadi false
        }
    };

    useEffect(() => {
        fetchData();
    }, [lazyState]);

    const router = useRouter();
    const openNewPenerimaan = () => {
        setKas(emptykas);
        router.push('/pembukuan/kas/form?jenis=penerimaan&status=create');
    };

    const openNew = () => {
        setKas(emptykas);
        setJenisTransaksiKasDialog(true);
    };

    const openNewPengeluaran = () => {
        setKas(emptykas);
        router.push('/pembukuan/kas/form?jenis=pengeluaran&status=create');
    };

    const hideDeleteKasDialog = () => {
        setDeleteKasDialog(false);
    };

    const [today, setToday] = useState(new Date());
    const [namaKoperasi, setNamaKoperasi] = useState('');
    const [alamatKoperasi, setAlamatKoperasi] = useState('');
    const [teleponKoperasi, setTeleponKoperasi] = useState('');
    const [kotaKoperasi, setKotaKoperasi] = useState('');
    const formatDatePdf = (date) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(date).toLocaleDateString('id-ID', options);
    };

    const komponenPDF = async () => {
        try {
            const config = await getDBConfig('nama_hotel', 'alamat_hotel', 'no_telp', 'kota');
            setNamaKoperasi(config.nama_hotel);
            setAlamatKoperasi(config.alamat_hotel);
            setTeleponKoperasi(config.no_telp);
            setKotaKoperasi(config.kota);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const [showPreview, setShowPreview] = useState(false);

    // Fungsi untuk menampilkan popup iframe
    function handleShowPreview() {
        setShowPreview(true);
    }

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (kasTabelFilt.length == 0 || !kasTabelFilt) {
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
            const dataPDF = kasTabelFilt ? JSON.parse(JSON.stringify(kasTabelFilt)) : [];

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.format,
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
            if (!dataPDF || dataPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Transaksi Kas';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(tglAwal) + ' s.d ' + formatDate(tglAkhir);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan, unitUsaha });

            const totalPenerimaan = () => {
                const total = kasTabelFilt?.reduce((sum, item) => sum + (item.Penerimaan || 0), 0) || 0;
                return formatRibuan(total);
            };

            const totalPengeluaran = () => {
                const total = kasTabelFilt?.reduce((sum, item) => sum + (item.Pengeluaran || 0), 0) || 0;
                return formatRibuan(total);
            };

            const tableData = dataPDF.map((item) => [item.Faktur, formatDate(item.Tgl), item.Rekening, formatColumnValue(item.Penerimaan), formatColumnValue(item.Pengeluaran), item.Keterangan]);
            tableData.push(['', '', 'Total : ', totalPenerimaan(), totalPengeluaran(), '']);


            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['FAKTUR', 'TGL', 'REKENING', 'PENERIMAAN', 'PENGELUARAN', 'KETERANGAN']],
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

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2, unitUsaha });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(kasTabelFilt, 'laporan-transaksi-kas.xlsx');
    };

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    const editKas = async (rowData) => {
        const { Faktur } = rowData;
        try {
            localStorage.setItem('Faktur', Faktur);
            if (Faktur.startsWith('KM')) {
                router.push('/pembukuan/kas/form?jenis=penerimaan&status=update');
            } else {
                router.push('/pembukuan/kas/form?jenis=pengeluaran&status=update');
            }
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const confirmDeleteKas = (Kas) => {
        setKas(Kas);
        setDeleteKasDialog(true);
    };

    const deleteKas = async () => {
        try {
            const vaDelete = await postData(apiEndPointDelete, { Faktur: kas.Faktur });
            let data = vaDelete.data;
            showSuccess(toast, data?.message)
            setKas(emptykas);
            setDeleteKasDialog(false);
            loadLazyData();
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    // Toolbar diatas data tabel --------------------------------------------------//
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2" style={{ display: 'flex', alignItems: 'center' }}>
                    <Button label="Add" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew}></Button>
                </div>
            </React.Fragment>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-1 mt-1">
                <div className="p-inputgroup">
                    <React.Fragment>
                        <Button label="Preview" icon="pi pi-file" className="p-button-success mr-2" onClick={btnAdjust} />
                    </React.Fragment>
                </div>
            </div>
        );
    };

    // Footer --------------------------------------------------//

    const deleteKasDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteKasDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteKas} />
        </>
    );

    const onPage = (event) => {
        // Set lazyState from event
        setlazyState(event);

        // Ensure filters remain as strings if they are objects
        if (event.filters) {
            Object.keys(event.filters).forEach((key) => {
                const filterValue = event.filters[key];
                if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                    const stringValue = Object.values(filterValue).join('');
                    event.filters[key] = stringValue;
                }
            });
        }
        // Set first and rows for pagination
        setFirst(event.first);
        setRows(event.rows);

        // Load data with updated lazyState
        loadLazyData();
    };

    const actionBodyTemplate = (rowData) => {
        if (rowData.Faktur == ' ') {
            return ''; // Jika tanggal tidak valid, kembalikan string kosong
        }
        return (
            <>
                <div style={{ display: 'flex', 'align-items': 'center', gap: '3px' }}>
                    <Button icon="pi pi-pencil" severity="success" style={{ width: '37px', height: '37px', 'font-size': '14px' }} rounded className="mr-1" onClick={() => editKas(rowData)} title="Edit" />
                    <Button icon="pi pi-trash" severity="warning" style={{ width: '37px', height: '37px', 'font-size': '14px' }} rounded onClick={() => confirmDeleteKas(rowData)} title="Delete" />
                </div>
            </>
        );
    };

    const loadLazyData = async () => {
        setLoading(true);
        const requestData = {
            TglAwal: convertToISODate(tglAwal),
            TglAkhir: convertToISODate(tglAkhir)
        };
        try {
            const vaTable = await postData(apiEndPointGet, requestData);
            const json = vaTable.data;
            setKasTabel(json.data);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
        setLoading(false);
    };

    const handleStartDateChange = (e) => {
        setTglAwal(e.value);
    };
    const handleEndDateChange = (e) => {
        setTglAkhir(e.value);
    };
    const handleInputAwalChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setTglAwal);
    };
    const handleInputAkhirChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setTglAkhir);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-row md:justify-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar value={tglAwal} onChange={handleStartDateChange} placeholder="Start Date" onInput={handleInputAwalChange} dateFormat="dd-mm-yy" style={{ width: '120px' }} />
                    <Calendar value={tglAkhir} onChange={handleEndDateChange} placeholder="End Date" onInput={handleInputAkhirChange} dateFormat="dd-mm-yy" style={{ width: '120px' }} />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} />
                </div>
                <div className="flex flex-row">
                    {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih kolom" /> */}
                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText placeholder="Search" value={search} onChange={(e) => filterPlugins('search', e.target.value)} className="w-full" />
                    </span>
                </div>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = kasTabel.filter((d) => (x ? x.test(d.Faktur) || x.test(d.Tgl) || x.test(d.Rekening) || x.test(d.Penerimaan) || x.test(d.Pengeluaran) || x.test(d.Keterangan) : []));
            setSearch(searchVal);
        }

        setKasTabelFilt(filtered);
    };

    const nominalPenerimaanBodyTemplate = (rowData) => {
        let formattedValue = 0;
        if (rowData.Penerimaan === 0) {
            formattedValue = '';
        } else {
            formattedValue = formatRibuan(rowData.Penerimaan);
        }
        return formattedValue;
    };

    const tglBodyTemplate = (rowData) => {
        const date = new Date(rowData.Tgl);
        if (isNaN(date)) {
            return ''; // Jika tanggal tidak valid, kembalikan string kosong
        }
        const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        return formattedDate;
    };

    const nominalPengeluaranBodyTemplate = (rowData) => {
        let formattedValue = 0;
        if (rowData.Pengeluaran === 0) {
            formattedValue = '';
        } else {
            formattedValue = formatRibuan(rowData.Pengeluaran);
        }
        return formattedValue;
    };

    const totalPenerimaan = kasTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.Penerimaan) || 0), 0);
    const totalPengeluaran = kasTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.Pengeluaran) || 0), 0);

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: 'center' }} footer="Total:" colSpan={3} footerStyle={{ textAlign: 'right' }} />
                <Column
                    headerStyle={{ textAlign: 'center' }}
                    colSpan={1}
                    footer={formatRibuan(totalPenerimaan)}
                    footerStyle={{ textAlign: 'right' }}
                />
                <Column
                    headerStyle={{ textAlign: 'center' }}
                    colSpan={1}
                    footer={formatRibuan(totalPengeluaran)}
                    footerStyle={{ textAlign: 'right' }}
                />

                <Column headerStyle={{ textAlign: 'center' }} colSpan={3} />
            </Row>
        </ColumnGroup>
    );

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
                        <h4>Transaksi Kas</h4>
                        <hr />
                        <Toast ref={toast} />
                        <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

                        <DataTable
                            value={kasTabelFilt}
                            filters={lazyState.filters}
                            header={header}
                            first={first} // Menggunakan nilai halaman pertama dari state
                            rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                            onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                            paginator
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            totalRecords={totalRecords}
                            size="small"
                            loading={loading}
                            emptyMessage="Data Kosong"
                            onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                            footerColumnGroup={footerGroup}
                        >
                            <Column field="Faktur" header="FAKTUR"></Column>
                            <Column field="Tgl" header="TANGGAL" body={tglBodyTemplate}></Column>
                            <Column field="Rekening" header="REKENING"></Column>
                            <Column align={'right'} field="Penerimaan" body={nominalPenerimaanBodyTemplate} style={{ textAlign: 'right' }} header="PENERIMAAN"></Column>
                            <Column align={'right'} field="Pengeluaran" body={nominalPengeluaranBodyTemplate} style={{ textAlign: 'right' }} header="PENGELUARAN"></Column>
                            <Column field="Keterangan" header="KETERANGAN"></Column>
                            <Column field="ACTION" header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>
                    </div>
                </div>
                <Dialog visible={deleteKasDialog} header="Confirm" modal footer={deleteKasDialogFooter} onHide={hideDeleteKasDialog}>
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        {kas && (
                            <span>
                                Yakin ingin menghapus <strong>{kas.Faktur}</strong>
                            </span>
                        )}
                    </div>
                </Dialog>
                {/* Dialog Jenis Transaksi Kas*/}
                <Dialog visible={jenisTransaksiKasDialog} header="Pilih Jenis Transaksi Kas" modal onHide={() => setJenisTransaksiKasDialog(false)}>
                    <div className="flex align-items-center justify-content-center">
                        <Button label="Penerimaan Kas" icon="pi pi-plus" className="p-button-info mr-2" onClick={openNewPenerimaan} />
                        <Button label="Pengeluaran Kas" icon="pi pi-minus" className="p-button-warning mr-2" onClick={openNewPengeluaran} />
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
