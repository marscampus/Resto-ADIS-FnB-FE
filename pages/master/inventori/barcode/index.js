import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import Produk from '../../../component/produk';
import jsPDF from 'jspdf';
import { getEmail, getUserName, showError, showSuccess } from '../../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../../component/PDFViewer';
import { Footer, HeaderLaporan, addPageInfo } from '../../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import PrintBarcode from './printBarcode';
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

export default function MasterBarcode() {
    // PATH INSERT
    const apiEndPointStore = '/api/barcode/store';
    // PATH UPDATE
    const apiEndPointUpdate = '/api/barcode/update';
    // PATH GET
    const apiEndPointGet = '/api/barcode/get';
    // PATH GET DATA EDIT
    const apiEndPointGetDataEdit = '/api/barcode/getdata_edit';
    // PATH DELETE DIALOG
    const apiEndPointDeleteDialog = '/api/barcode/delete_dialog';
    // PATH DELETE
    const apiEndPointDelete = '/api/barcode/delete';

    const toast = useRef(null);
    const [barcodeDialog, setBarcodeDialog] = useState(false);
    const [deletePrintBarcodeDialog, setDeletePrintBarcodeDialog] = useState(false);
    const [deleteBarcodeDialog, setDeleteBarcodeDialog] = useState(false);
    const [deleteBarcodeInDialog, setDeleteBarcodeInDialog] = useState(false);
    const [printBarcode, setPrintBarcode] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [barcodeTabel, setBarcodeTabel] = useState(null);
    const [barcodeTabelFilt, setBarcodeTabelFilt] = useState(null);
    const [barcodeTambah, setBarcodeTambah] = useState(null);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [priceTagTabel, setPriceTagTabel] = useState([]);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [search, setSearch] = useState('');
    const fileName = `master-barcode-${new Date().toISOString().slice(0, 10)}`;
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [barcode, setBarcode] = useState([]);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
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

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    useEffect(() => {
        setBarcodeTabelFilt(barcodeTabel);
    }, [barcodeTabel, lazyState]);

    const loadLazyData = async () => {
        setLoading(true);
        let requestBody = { ...lazyState };
        try {
            const vaTable = await postData(apiEndPointGet, requestBody);
            const jsonBarcode = vaTable.data;
            setTotalRecords(jsonBarcode.total_data);
            setBarcodeTabel(jsonBarcode.data);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
    };
    // -----------------------------------------------------------------------------------------------------------------< PRODUK / BARCODE >
    const [produkDialog, setProdukDialog] = useState(false);
    const [dataProduk, setDataProduk] = useState('');
    const btnProduk = () => {
        setProdukDialog(true);
    };
    const handleProduk = (dataProduk) => {
        setDataProduk(dataProduk);
        const kode = dataProduk.KODE;
        const nama = dataProduk.NAMA;
        onRowSelectBarcode(kode);
        setBarcode((prevBarcode) => ({
            ...prevBarcode,
            KODE: kode,
            NAMA: nama
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Print Barcode >
    const [printBarcodeDialog, setPrintBarcodeDialog] = useState(false);
    const btnPrintBarcode = () => {
        setPrintBarcodeDialog(true);
    };

    const onRowSelectBarcode = async (kode) => {
        let requestBody = {
            KODE: kode
        };
        try {
            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data;
            setBarcodeTambah(json.data.stock);
            showSuccess(toast, json?.message)
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };
    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openNew = () => {
        setBarcode(prevState => ({ STATUS: '1' }));
        setBarcodeDialog(true);
        setIsUpdateMode(false);
    };

    const hideDialog = () => {
        setNull();
        setBarcodeTambah([]);
        setBarcodeDialog(false);
    };

    const hideDeleteBarcodeDialog = () => {
        setDeleteBarcodeDialog(false);
    };

    const hideDeleteBarcodeInDialog = () => {
        setDeleteBarcodeInDialog(false);
    };

    const hideBarcodePrintDialog = () => {
        setNull();
        setPriceTagTabel([]);
        setPrintBarcodeDialog(false);
    };

    // ----------------------------------------------------------------------------------------------------------------- Datatable
    const onInputChangeBarcode = (e, field) => {
        const { checked } = e.target;
        const value = checked ? '1' : '0'; // Jika checkbox dicentang, nilai menjadi 1; jika tidak, menjadi 0
        setBarcode((prevBarcode) => ({
            ...prevBarcode,
            STATUS: value
        }));
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _barcode = { ...barcode };
        _barcode[name] = val;
        setBarcode(_barcode);
    };
    // ---------------------------------------------------------------------------------------------------------------- func CRUD
    const confirmDeleteBarcode = (barcode) => {
        setBarcode(barcode);
        setDeleteBarcodeDialog(true);
    };

    const setNull = () => {
        setBarcode({
            BARCODE: '',
            KETERANGAN: '',
            STATUS: false
        });
        setPrintBarcode({
            KODE_TOKO: '',
            NAMA: '',
            HJ: '',
            JUMLAH: ''
        });
    };

    const deleteBarcode = async () => {
        let requestBody = {
            KODE: barcode.KODE
        };
        try {
            const vaTable = await postData(apiEndPointDelete, requestBody);
            let data = vaTable.data;
            showSuccess(toast, data?.message)
            setBarcodeTambah([]);
            setDeleteBarcodeDialog(false);
            loadLazyData();
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const deleteTambah = async (rowData) => {
        let requestBody = {
            KODE: rowData.KODE,
            BARCODE: rowData.BARCODE
        };
        try {
            const vaTable = await postData(apiEndPointDeleteDialog, requestBody);
            let data = vaTable.data;
            showSuccess(toast, data?.message)
            const newData = barcodeTambah.filter((item) => item.BARCODE !== rowData.BARCODE);
            setBarcodeTambah(newData);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const findIndexById = (BARCODE) => {
        let index = -1;
        for (let i = 0; i < barcodeTambah.length; i++) {
            if (barcodeTambah[i].BARCODE === BARCODE) {
                index = i;
                break;
            }
        }
        return index;
    };

    const saveBarcode = async (e) => {
        e.preventDefault();
        let _barcodeTambah = [...barcodeTambah];
        let _barcode = { ...barcode };
        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaTable = await postData(endPoint, _barcode);
            let data = vaTable.data;
            showSuccess(toast, data?.message)
            if (isUpdateMode) {
                const index = findIndexById(barcode.BARCODE);
                _barcodeTambah[index].KETERANGAN = _barcode.KETERANGAN;
                setBarcodeTambah(_barcodeTambah);
                setBarcode([]);
            } else {
                // Tampil di Tabel bawahnya
                const data = {
                    KODE: barcode.KODE,
                    NAMA: barcode.NAMA,
                    BARCODE: barcode.BARCODE,
                    KETERANGAN: barcode.KETERANGAN,
                    STATUS: barcode.STATUS
                };
                const updateData = [...barcodeTambah];
                updateData.push(data);
                setBarcodeTambah(updateData);
                // setBarcodeDialog(false);
            }
            setBarcode((prevBarcode) => ({
                ...prevBarcode,
                BARCODE: '',
                KETERANGAN: ''
            }));
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const editBarcode = async (barcode) => {
        setIsUpdateMode(true);
        setBarcodeDialog(true);
        setBarcode({ ...barcode });
        let requestBody = {
            KODE: barcode.KODE
        };
        try {
            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data;
            setBarcodeTambah(json.data.stock);
            showSuccess(toast, json?.message)
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const onRowSelectBarcodeTambah = (event) => {
        const selectedBarcode = event.data.BARCODE;
        const selectedBarcodeData = barcodeTambah.find((barcode) => barcode.BARCODE === selectedBarcode);
        if (selectedBarcodeData) {
            setBarcode((prevData) => ({
                ...prevData,
                KODE: selectedBarcodeData.KODE,
                NAMA: selectedBarcodeData.NAMA,
                BARCODE: selectedBarcodeData.BARCODE,
                KETERANGAN: selectedBarcodeData.KETERANGAN,
                STATUS: selectedBarcodeData.STATUS
            }));
        }
    };
    // ----------------------------------------------------------------------------------------------------------------- Button
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                </div>
            </React.Fragment>
        );
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (barcodeTabel.length == 0 || !barcodeTabel) {
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
            const barcodeTabelPDF = barcodeTabelFilt ? JSON.parse(JSON.stringify(barcodeTabelFilt)) : [];

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

            if (!barcodeTabelPDF || barcodeTabelPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Barcode';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = barcodeTabelPDF.map((item) => [item.KODE, item.NAMA]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE', 'KETERANGAN']],
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
                columnStyles: {},
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
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(barcodeTabelFilt, 'master-barcode.xlsx');
    };

    const previewBarcode = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                    <Button label="Print Barcode" icon="pi pi-print" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnPrintBarcode} />
                </div>
            </React.Fragment>
        );
    };

    const barcodeDialogFooter = (
        <>
            <Button label="Batal" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Simpan" icon="pi pi-check" className="p-button-text" onClick={saveBarcode} />
        </>
    );

    const deleteBarcodeInDialogFooter = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" severity="danger" rounded onClick={() => deleteTambah(rowData)} />
            </>
        );
    };
    // button delete di tabel luar
    const deleteBarcodeDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteBarcodeDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteBarcode} />
        </>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editBarcode(rowData)} />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteBarcode(rowData)} />
            </>
        );
    };

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih Kolom" /> */}
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
            filtered = barcodeTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.NAMA) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = barcodeTabel;
            } else {
                filtered = barcodeTabel.filter((d) => (x ? x.test(d.KODE) : []));
            }
        }

        setBarcodeTabelFilt(filtered);
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
                        <h4>Menu Barcode</h4>
                        <hr />
                        <Toast ref={toast} />
                        <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                        <DataTable
                            value={barcodeTabelFilt}
                            size="small"
                            dataKey="KODE"
                            paginator
                            className="datatable-responsive"
                            totalRecords={totalRecords}
                            loading={loading}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            header={headerSearch}
                            filters={lazyState.filters}
                            first={first} // Menggunakan nilai halaman pertama dari state
                            rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                            onPage={onPage}
                            emptyMessage="Data Kosong"
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="KETERANGAN"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>
                        <Toolbar className="mb-4" start={previewBarcode}></Toolbar>

                        {/* Dialog Tambah edit Barcode */}
                        <Dialog visible={barcodeDialog} style={{ width: '75%' }} header="Dialog Barcode" modal className="p-fluid" footer={barcodeDialogFooter} onHide={hideDialog}>
                            <div className="formgrid grid">
                                <div className="field col-6 mb-2 lg:col-6">
                                    <div className="formgrid grid">
                                        <div className="field col-12 mb-2 lg:col-6">
                                            <label htmlFor="kode">Kode</label>
                                            <div className="p-inputgroup">
                                                <InputText readOnly id="kode" value={barcode.KODE} onChange={(e) => onInputChange(e, 'KODE')} />
                                                <Button disabled={isUpdateMode} icon="pi pi-search" className="p-button" onClick={btnProduk} />
                                            </div>
                                        </div>
                                        <div className="field col-12 mb-2 lg:col-6">
                                            <label htmlFor="nama">Nama</label>
                                            {/* <div className="p-inputgroup">{isUpdateMode ? <InputText id="nama" value={barcode.NAMA} readOnly onChange={(e) => onInputChangeBarcode(e, "NAMA")}  /> : <InputText readOnly value={keteranganBarcode} />}</div> */}
                                            <div className="p-inputgroup">
                                                <InputText id="nama" readOnly={isUpdateMode} value={barcode.NAMA} onChange={(e) => onInputChange(e, 'NAMA')} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="field col-6 mb-2 lg:col-6">
                                    <div className="formgrid grid">
                                        <div className="field col-12 mb-2 lg:col-9">
                                            <label htmlFor="barcode">Barcode</label>
                                            <div className="p-inputgroup">
                                                <InputText id="barcode" readOnly={isUpdateMode} value={barcode.BARCODE} onChange={(e) => onInputChange(e, 'BARCODE')} autoFocus />
                                            </div>
                                        </div>
                                        <div className="field col-12 mb-2 lg:col-3">
                                            <label htmlFor="status">Status</label>
                                            <div className="p-inputgroup">
                                                <Checkbox inputId="status" checked={barcode.STATUS === '1'} onChange={(e) => onInputChangeBarcode(e, 'STATUS')} style={{ marginRight: '5px' }} />
                                                <label htmlFor="status">Aktif</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="keterangan">Keterangan</label>
                                    <div className="p-inputgroup">
                                        <InputText id="keterangan" value={barcode.KETERANGAN} onChange={(e) => onInputChange(e, 'KETERANGAN')} required />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2">
                                <DataTable
                                    value={barcodeTambah}
                                    size="small"
                                    lazy
                                    dataKey="KODE"
                                    rows={10}
                                    loading={loading}
                                    className="datatable-responsive"
                                    first={lazyState.first}
                                    totalRecords={totalRecords}
                                    onPage={onPage}
                                    onRowSelect={onRowSelectBarcodeTambah}
                                    selectionMode={isUpdateMode ? 'single' : null} // Memungkinkan pemilihan satu baris
                                >
                                    <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                                    <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="BARCODE" header="BARCODE"></Column>
                                    <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                                    {isUpdateMode ? <Column headerStyle={{ textAlign: 'center' }} field="ACTION" header="ACTION" body={deleteBarcodeInDialogFooter}></Column> : null}
                                </DataTable>
                            </div>
                        </Dialog>
                        <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProduk={handleProduk} />
                        <PrintBarcode
                            printBarcodeDialog={printBarcodeDialog}
                            hideBarcodePrintDialog={hideBarcodePrintDialog}
                            deletePrintBarcodeDialog={deletePrintBarcodeDialog}
                            printBarcode={printBarcode}
                            setPrintBarcode={setPrintBarcode}
                            priceTagTabel={priceTagTabel}
                        />

                        {/* Dialog In Delete */}
                        <Dialog visible={deleteBarcodeInDialog} header="Confirm" modal footer={deleteBarcodeInDialogFooter} onHide={hideDeleteBarcodeInDialog}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {barcode && (
                                    <span>
                                        apakah kamu ingin menghapus  <strong>{barcode.KODE}</strong>
                                    </span>
                                )}
                            </div>
                        </Dialog>
                        {/* Dialog Delete */}
                        <Dialog visible={deleteBarcodeDialog} header="Confirm" modal footer={deleteBarcodeDialogFooter} onHide={hideDeleteBarcodeDialog}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {barcode && (
                                    <span>
                                        apakah kamu ingin menghapus  <strong>{barcode.KODE}</strong>
                                    </span>
                                )}
                            </div>
                        </Dialog>
                    </div>
                </div>
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
